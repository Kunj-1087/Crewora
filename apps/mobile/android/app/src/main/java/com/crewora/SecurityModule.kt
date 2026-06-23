package com.crewora

import android.app.Activity
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Screen Security Native Module
 *
 * Wraps Android's FLAG_SECURE to prevent screenshots and screen recording
 * on sensitive screens (OTP entry, profiles, request details with contacts).
 *
 * Exposed to JavaScript as:
 *   NativeModules.ScreenSecurity.setSecure(enabled: boolean)
 */
class SecurityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenSecurity"

    @ReactMethod
    fun setSecure(enabled: Boolean) {
        val activity: Activity? = currentActivity
        activity?.runOnUiThread {
            if (enabled) {
                activity.window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            } else {
                activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
        }
    }
}
