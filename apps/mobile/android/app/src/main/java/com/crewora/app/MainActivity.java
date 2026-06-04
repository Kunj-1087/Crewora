package com.crewora.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceLanguagePlugin.class);
        
        // Safely initialize Firebase with dummy options if google-services.json is missing
        // to prevent startup crashes when @capacitor/push-notifications attempts to load.
        try {
            Class<?> firebaseAppClass = Class.forName("com.google.firebase.FirebaseApp");
            java.util.List<?> apps = (java.util.List<?>) firebaseAppClass.getMethod("getApps", android.content.Context.class).invoke(null, this);
            if (apps == null || apps.isEmpty()) {
                Class<?> firebaseOptionsBuilderClass = Class.forName("com.google.firebase.FirebaseOptions$Builder");
                Object builder = firebaseOptionsBuilderClass.getConstructor().newInstance();
                
                builder = firebaseOptionsBuilderClass.getMethod("setApplicationId", String.class).invoke(builder, "1:1234567890:android:321abc456def7890");
                builder = firebaseOptionsBuilderClass.getMethod("setApiKey", String.class).invoke(builder, "AIzaSyDummyKeyForPreventingCrashOnStartup");
                builder = firebaseOptionsBuilderClass.getMethod("setProjectId", String.class).invoke(builder, "crewora-dummy");
                
                Object options = firebaseOptionsBuilderClass.getMethod("build").invoke(builder);
                
                Class<?> firebaseOptionsClass = Class.forName("com.google.firebase.FirebaseOptions");
                firebaseAppClass.getMethod("initializeApp", android.content.Context.class, firebaseOptionsClass).invoke(null, this, options);
            }
        } catch (Exception e) {
            // Safe fallback: Firebase library not present, or initialization failed
        }

        super.onCreate(savedInstanceState);
    }
}
