package com.crewora.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "DeviceLanguage")
public class DeviceLanguagePlugin extends Plugin {

    @PluginMethod
    public void getLanguage(PluginCall call) {
        Locale defaultLocale = Locale.getDefault();
        String language = defaultLocale.getLanguage();
        String country = defaultLocale.getCountry();
        String languageTag = language;
        if (country != null && !country.isEmpty()) {
            languageTag = language + "-" + country;
        }
        
        JSObject ret = new JSObject();
        ret.put("language", language);
        ret.put("country", country);
        ret.put("languageTag", languageTag);
        call.resolve(ret);
    }
}
