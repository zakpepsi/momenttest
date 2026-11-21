// Register this plugin from the app's CAPBridgeViewController subclass.
import Capacitor

class MomentsBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(InstagramStoriesPlugin())
    }
}
