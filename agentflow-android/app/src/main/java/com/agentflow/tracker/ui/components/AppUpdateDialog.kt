package com.agentflow.tracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agentflow.tracker.domain.update.UpdateState
import com.agentflow.tracker.ui.theme.PinkLight
import com.agentflow.tracker.ui.theme.PinkPrimary
import com.agentflow.tracker.ui.theme.SuccessGreen
import java.util.Locale

@Composable
fun AppUpdateDialog(
    updateState: UpdateState,
    onStartDownload: (String) -> Unit,
    onInstall: () -> Unit,
    onDismiss: () -> Unit
) {
    when (updateState) {
        is UpdateState.Available -> {
            AlertDialog(
                onDismissRequest = onDismiss,
                shape = RoundedCornerShape(20.dp),
                icon = {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(PinkLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.SystemUpdate,
                            contentDescription = null,
                            tint = PinkPrimary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                },
                title = {
                    Text(
                        text = "New Update Available!",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                text = {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Version ${updateState.versionName}",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                color = PinkPrimary
                            )
                            if (updateState.fileSizeMb > 0) {
                                Text(
                                    text = String.format(Locale.US, "%.1f MB", updateState.fileSizeMb),
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "What's New:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = updateState.changelog,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 18.sp
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { onStartDownload(updateState.downloadUrl) },
                        colors = ButtonDefaults.buttonColors(containerColor = PinkPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Update Now", fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = onDismiss) {
                        Text("Later", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }

        is UpdateState.Downloading -> {
            AlertDialog(
                onDismissRequest = { /* Non-dismissible while downloading */ },
                shape = RoundedCornerShape(20.dp),
                title = {
                    Text(
                        text = "Downloading Update...",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                text = {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        LinearProgressIndicator(
                            progress = { updateState.progress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = PinkPrimary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            val percent = (updateState.progress * 100).toInt()
                            Text(
                                text = "$percent%",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = PinkPrimary
                            )
                            Text(
                                text = String.format(Locale.US, "%.1f / %.1f MB", updateState.downloadedMb, updateState.totalMb),
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                confirmButton = {}
            )
        }

        is UpdateState.ReadyToInstall -> {
            AlertDialog(
                onDismissRequest = onDismiss,
                shape = RoundedCornerShape(20.dp),
                title = {
                    Text(
                        text = "Update Ready to Install",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                text = {
                    Text(
                        text = "The latest update has finished downloading. Tap install to finish updating.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                confirmButton = {
                    Button(
                        onClick = onInstall,
                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Install Now", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = onDismiss) {
                        Text("Close", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }

        is UpdateState.Error -> {
            val isOffline = updateState.message.contains("connect to the internet", ignoreCase = true)
            AlertDialog(
                onDismissRequest = onDismiss,
                shape = RoundedCornerShape(20.dp),
                title = {
                    Text(
                        text = if (isOffline) "No Internet Connection" else "Update Error",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = if (isOffline) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.error
                    )
                },
                text = {
                    Text(
                        text = updateState.message,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                confirmButton = {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Text("Dismiss", color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            )
        }

        is UpdateState.UpToDate -> {
            AlertDialog(
                onDismissRequest = onDismiss,
                shape = RoundedCornerShape(20.dp),
                title = {
                    Text(
                        text = "Up to Date",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                text = {
                    Text(
                        text = "You are already using the latest version of AgentFlow.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                confirmButton = {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = PinkPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("OK", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }

        else -> Unit
    }
}
