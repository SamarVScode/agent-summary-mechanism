package com.agentflow.tracker.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agentflow.tracker.data.api.SupabaseService
import com.agentflow.tracker.data.local.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val casperId: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

class LoginViewModel(
    private val supabaseService: SupabaseService,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onCasperIdChanged(id: String) {
        _uiState.value = _uiState.value.copy(casperId = id, errorMessage = null)
    }

    fun onPasswordChanged(pass: String) {
        _uiState.value = _uiState.value.copy(password = pass, errorMessage = null)
    }

    fun login() {
        val id = _uiState.value.casperId.trim()
        val pass = _uiState.value.password.trim()

        if (id.isBlank() || pass.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter both Casper ID and password")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = supabaseService.getAgentByCasperId(id)

            result.onSuccess { agent ->
                if (agent.password == pass) {
                    userPreferences.saveAgentInfo(agent.name, agent.casperId, agent.rateAmount)
                    _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Incorrect password"
                    )
                }
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: "Authentication failed"
                )
            }
        }
    }
}
