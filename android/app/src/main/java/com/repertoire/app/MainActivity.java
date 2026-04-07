package com.repertoire.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null && "text/plain".equals(type)) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            String sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT);

            if (sharedText != null) {
                // URL'yi çıkar
                String url = sharedText;
                String title = sharedTitle != null ? sharedTitle : "";

                // /share sayfasına yönlendir
                String shareUrl = "https://repertoire-tau.vercel.app/share?url=" +
                    java.net.URLEncoder.encode(url) +
                    "&title=" + java.net.URLEncoder.encode(title);

                // WebView'da aç
                if (this.bridge != null && this.bridge.getWebView() != null) {
                    this.bridge.getWebView().loadUrl(shareUrl);
                }
            }
        }
    }
}
