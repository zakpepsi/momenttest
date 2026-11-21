import Capacitor
import UIKit

@objc(InstagramStoriesPlugin)
public class InstagramStoriesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "InstagramStoriesPlugin"
    public let jsName = "InstagramStories"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)
    ]

    @objc func share(_ call: CAPPluginCall) {
        guard let encoded = call.getString("imageBase64"),
              let data = Data(base64Encoded: encoded) else {
            call.reject("No valid story image was provided.")
            return
        }
        guard let appID = Bundle.main.object(forInfoDictionaryKey: "FacebookAppID") as? String,
              !appID.isEmpty, !appID.contains("YOUR_META_APP_ID") else {
            call.reject("Configure the Meta App ID before sharing to Instagram Stories.")
            return
        }
        guard let url = URL(string: "instagram-stories://share") else {
            call.reject("Instagram Story sharing URL is unavailable.")
            return
        }
        let pasteboardItem: [String: Any] = [
            "com.instagram.sharedSticker.backgroundImage": data,
            "com.instagram.sharedSticker.appID": appID
        ]
        UIPasteboard.general.setItems([pasteboardItem], options: [
            .expirationDate: Date().addingTimeInterval(5 * 60)
        ])
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened { call.resolve() }
                else { call.reject("Instagram is not installed or could not open Stories.") }
            }
        }
    }
}
