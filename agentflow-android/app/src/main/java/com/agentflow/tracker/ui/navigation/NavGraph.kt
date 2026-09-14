package com.agentflow.tracker.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences
import com.agentflow.tracker.domain.date.DateUtils
import com.agentflow.tracker.domain.ocr.MlKitOcrExtractor
import com.agentflow.tracker.ui.components.AgentFlowBottomBar
import com.agentflow.tracker.ui.components.AgentFlowTopBar
import com.agentflow.tracker.ui.screens.dashboard.DashboardScreen
import com.agentflow.tracker.ui.screens.dashboard.DashboardViewModel
import com.agentflow.tracker.ui.screens.leave.LeaveScreen
import com.agentflow.tracker.ui.screens.leave.LeaveViewModel
import com.agentflow.tracker.ui.screens.login.LoginScreen
import com.agentflow.tracker.ui.screens.login.LoginViewModel
import com.agentflow.tracker.domain.update.AppUpdateManager
import com.agentflow.tracker.domain.update.UpdateState
import com.agentflow.tracker.ui.components.AppUpdateDialog
import androidx.compose.runtime.LaunchedEffect
import com.agentflow.tracker.ui.screens.profile.ProfileScreen
import com.agentflow.tracker.ui.screens.profile.ProfileViewModel
import com.agentflow.tracker.ui.screens.tracker.TrackerScreen
import com.agentflow.tracker.ui.screens.tracker.TrackerViewModel
import kotlinx.coroutines.launch

@Composable
fun AgentFlowNavGraph(
    userPreferences: UserPreferences,
    supabaseService: SupabaseService,
    appUpdateManager: AppUpdateManager,
    navController: NavHostController = rememberNavController()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val agentNamePref by userPreferences.agentNameFlow.collectAsState(initial = null)
    val casperIdPref by userPreferences.casperIdFlow.collectAsState(initial = null)
    val rateAmountPref by userPreferences.rateAmountFlow.collectAsState(initial = null)

    // Await preferences from disk to eliminate momentary flash of login screen on startup
    if (agentNamePref == null || casperIdPref == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        )
        return
    }

    val agentName = agentNamePref ?: ""
    val casperId = casperIdPref ?: ""
    val rateAmount = rateAmountPref ?: 13.0

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Tracker.route

    val isLoggedIn = agentName.isNotBlank() && casperId.isNotBlank()
    val startDestination = if (isLoggedIn) Screen.Tracker.route else Screen.Login.route

    val updateState by appUpdateManager.updateState.collectAsState()

    // Silently check for updates when app opens
    LaunchedEffect(Unit) {
        appUpdateManager.checkForUpdates(manualCheck = false)
    }

    // Leave ViewModel shared for unread notification count
    val leaveViewModel = remember(agentName) {
        LeaveViewModel(supabaseService, agentName)
    }
    val leaveUiState by leaveViewModel.uiState.collectAsState()

    val isAuthRoute = currentRoute == Screen.Login.route

    Scaffold(
        topBar = {
            if (!isAuthRoute && isLoggedIn) {
                AgentFlowTopBar(
                    agentName = agentName,
                    currentDate = DateUtils.formatDate()
                )
            }
        },
        bottomBar = {
            if (!isAuthRoute && isLoggedIn) {
                AgentFlowBottomBar(
                    currentRoute = currentRoute,
                    hasUnreadLeaves = leaveUiState.hasUnreadLeaves,
                    onNavigate = { route ->
                        if (currentRoute != route) {
                            navController.navigate(route) {
                                popUpTo(Screen.Tracker.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(if (isAuthRoute) androidx.compose.foundation.layout.PaddingValues(0.dp) else innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = startDestination
            ) {
                composable(Screen.Login.route) {
                    val loginViewModel = remember {
                        LoginViewModel(supabaseService, userPreferences)
                    }
                    LoginScreen(
                        viewModel = loginViewModel,
                        onLoginSuccess = {
                            navController.navigate(Screen.Tracker.route) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        }
                    )
                }

                composable(Screen.Dashboard.route) {
                    val dashboardViewModel = remember(agentName, rateAmount) {
                        DashboardViewModel(supabaseService, agentName, rateAmount)
                    }
                    DashboardScreen(viewModel = dashboardViewModel)
                }

                composable(Screen.Tracker.route) {
                    val ocrExtractor = remember { MlKitOcrExtractor(context) }
                    val trackerViewModel = remember(agentName, casperId, rateAmount) {
                        TrackerViewModel(
                            supabaseService = supabaseService,
                            ocrExtractor = ocrExtractor,
                            context = context,
                            agentName = agentName,
                            casperId = casperId,
                            rateAmount = rateAmount
                        )
                    }
                    TrackerScreen(
                        viewModel = trackerViewModel,
                        agentName = agentName
                    )
                }

                composable(Screen.Leave.route) {
                    LeaveScreen(viewModel = leaveViewModel)
                }

                composable(Screen.Profile.route) {
                    val profileViewModel = remember(agentName, casperId, rateAmount) {
                        ProfileViewModel(
                            supabaseService = supabaseService,
                            userPreferences = userPreferences,
                            agentName = agentName,
                            casperId = casperId,
                            rateAmount = rateAmount
                        )
                    }
                    ProfileScreen(
                        viewModel = profileViewModel,
                        appUpdateManager = appUpdateManager,
                        onLogout = {
                            scope.launch {
                                userPreferences.clearAgentInfo()
                                navController.navigate(Screen.Login.route) {
                                    popUpTo(0) { inclusive = true }
                                }
                            }
                        }
                    )
                }
            }
        }
    }

    AppUpdateDialog(
        updateState = updateState,
        onStartDownload = { url ->
            scope.launch { appUpdateManager.downloadAndInstall(url) }
        },
        onInstall = {
            if (updateState is UpdateState.ReadyToInstall) {
                appUpdateManager.triggerInstall((updateState as UpdateState.ReadyToInstall).fileUri)
            }
        },
        onDismiss = appUpdateManager::resetState
    )
}
