package com.agentflow.tracker.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "agentflow_prefs")

class UserPreferences(private val context: Context) {

    companion object {
        val KEY_NAME = stringPreferencesKey("wt_agent_name")
        val KEY_CASPER_ID = stringPreferencesKey("wt_agent_id")
        val KEY_RATE = doublePreferencesKey("wt_agent_rate")
        val KEY_THEME = stringPreferencesKey("wt_theme") // "light", "dark", "system"
    }

    val agentNameFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_NAME].orEmpty()
    }

    val casperIdFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_CASPER_ID].orEmpty()
    }

    val rateAmountFlow: Flow<Double> = context.dataStore.data.map { prefs ->
        prefs[KEY_RATE] ?: 13.0
    }

    val themeFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_THEME] ?: "system"
    }

    suspend fun saveAgentInfo(name: String, casperId: String, rate: Double) {
        context.dataStore.edit { prefs ->
            prefs[KEY_NAME] = name
            prefs[KEY_CASPER_ID] = casperId
            prefs[KEY_RATE] = rate
        }
    }

    suspend fun clearAgentInfo() {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_NAME)
            prefs.remove(KEY_CASPER_ID)
            prefs[KEY_RATE] = 13.0
        }
    }

    suspend fun setTheme(theme: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_THEME] = theme
        }
    }
}
