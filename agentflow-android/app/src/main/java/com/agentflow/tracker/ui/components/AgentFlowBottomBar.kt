package com.agentflow.tracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.PersonOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agentflow.tracker.ui.navigation.Screen
import com.agentflow.tracker.ui.theme.ErrorRed
import com.agentflow.tracker.ui.theme.PinkPrimary

data class NavigationItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

@Composable
fun AgentFlowBottomBar(
    currentRoute: String,
    hasUnreadLeaves: Boolean,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        NavigationItem(Screen.Dashboard.route, "History", Icons.Default.GridView),
        NavigationItem(Screen.Tracker.route, "Log Work", Icons.Default.AddCircleOutline),
        NavigationItem(Screen.Leave.route, "Leave", Icons.Default.DateRange),
        NavigationItem(Screen.Profile.route, "Profile", Icons.Default.PersonOutline)
    )

    NavigationBar(
        modifier = Modifier.fillMaxWidth().height(68.dp),
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(item.route) },
                icon = {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.label,
                            modifier = Modifier.size(24.dp)
                        )
                        if (item.route == Screen.Leave.route && hasUnreadLeaves) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .align(Alignment.TopEnd)
                                    .offset(x = 4.dp, y = (-2).dp)
                                    .background(ErrorRed, CircleShape)
                            )
                        }
                    }
                },
                label = {
                    Text(
                        text = item.label,
                        fontSize = 11.sp,
                        color = if (isSelected) PinkPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PinkPrimary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}
