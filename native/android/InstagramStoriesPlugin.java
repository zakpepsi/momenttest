package com.momentsbridge.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "InstagramStories")
public class InstagramStoriesPlugin extends Plugin {
  @PluginMethod
  public void share(PluginCall call) {
    try {
      String encoded = call.getString("imageBase64");
      String mimeType = call.getString("mimeType", "image/jpeg");
      if (encoded == null || encoded.isEmpty()) {
        call.reject("No story image was provided.");
        return;
      }
      String appId = getContext().getString(R.string.facebook_app_id);
      if (appId.trim().isEmpty() || appId.contains("YOUR_META_APP_ID")) {
        call.reject("Configure the Meta App ID before sharing to Instagram Stories.");
        return;
      }
      byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
      File shareDir = new File(getContext().getCacheDir(), "instagram-story");
      if (!shareDir.exists() && !shareDir.mkdirs()) throw new IllegalStateException("Could not create share cache.");
      File image = new File(shareDir, "moments-story.jpg");
      try (FileOutputStream out = new FileOutputStream(image)) { out.write(bytes); }
      Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", image);
      Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
      intent.setDataAndType(uri, mimeType);
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      intent.putExtra("source_application", appId);
      if (intent.resolveActivity(getContext().getPackageManager()) == null) {
        call.reject("Instagram is not installed on this device.");
        return;
      }
      getActivity().startActivity(intent);
      call.resolve();
    } catch (Exception error) {
      call.reject("Could not open Instagram Story sharing.", error);
    }
  }
}
