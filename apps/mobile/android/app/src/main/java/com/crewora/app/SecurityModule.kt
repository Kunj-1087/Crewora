package com.crewora.app

import android.app.Activity
import android.view.WindowManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Screen Security Capacitor Plugin
 *
 * Wraps Android's FLAG_SECURE to prevent screenshots and screen recording
 * on sensitive screens (OTP entry, profiles, request details with contacts).
 *
 * Registered via MainApplication.java and importable in TypeScript as:
 *   import { ScreenSecurity } from '@/utils/screenSecurity';
 *
 * Exposed methods:
 *   setSecure({ enabled: boolean }) — enables/disables FLAG_SECURE
 */
@CapacitorPlugin(name = "ScreenSecurity")
class SecurityModule : Plugin() {

    @PluginMethod
    fun setSecure(call: PluginCall) {
        val enabled = call.getBoolean("enabled", false)
        val activity: Activity? = bridge.activity

        activity?.runOnUiThread {
            if (enabled) {
                activity.window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            } else {
                activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
        }

        call.resolve(JSObject().apply {
            put("enabled", enabled)
        })
    }
}
