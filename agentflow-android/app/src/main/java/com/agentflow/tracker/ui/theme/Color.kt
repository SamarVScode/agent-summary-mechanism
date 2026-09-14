package com.agentflow.tracker.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ── Simple Flat Blue Brand Palette ─────────────────────────────────────
val BluePrimary = Color(0xFF2563EB) // Clean Modern Flat Blue
val BlueHover = Color(0xFF1D4ED8)
val BlueLight = Color(0x1A2563EB)
val BlueLightDark = Color(0x252563EB)

// Flat Blue Linear Brand Gradients
val AgentFlowGradient = Brush.horizontalGradient(
    colors = listOf(Color(0xFF2563EB), Color(0xFF3B82F6))
)

val AgentFlowGradientVertical = Brush.verticalGradient(
    colors = listOf(Color(0xFF2563EB), Color(0xFF3B82F6))
)

// Primary & Accent Aliases (Flat Blue)
val PinkPrimary = BluePrimary
val PinkHover = BlueHover
val PinkLight = BlueLight
val PinkLightDark = BlueLightDark
val GradientOrange = Color(0xFF2563EB)
val GradientPink = Color(0xFF3B82F6)
val GradientPurple = Color(0xFF1D4ED8)

// Functional Status Colors
val SuccessGreen = Color(0xFF10B981)
val SuccessGreenLight = Color(0x1F10B981)
val ErrorRed = Color(0xFFEF4444)
val ErrorRedLight = Color(0x1FEF4444)
val WarningYellow = Color(0xFFF59E0B)
val WarningYellowLight = Color(0x1FF59E0B)

// ── Pure White Light Theme Palette ──────────────────────────────────────
val BackgroundLight = Color(0xFFFFFFFF)
val SurfaceLight = Color(0xFFFFFFFF)
val SurfaceHoverLight = Color(0xFFF4F4F5)
val BorderLight = Color(0xFFE4E4E7)
val InkLight = Color(0xFF09090B)
val InkSecondaryLight = Color(0xFF52525B)
val InkMutedLight = Color(0xFF71717A)

// ── Pitch Black Dark Theme Palette ──────────────────────────────────────
val BackgroundDark = Color(0xFF000000)
val SurfaceDark = Color(0xFF0D0D11)
val SurfaceHoverDark = Color(0xFF16161D)
val BorderDark = Color(0xFF22222B)
val InkDark = Color(0xFFFFFFFF)
val InkSecondaryDark = Color(0xFFA1A1AA)
val InkMutedDark = Color(0xFF71717A)

