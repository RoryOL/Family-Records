package app.familyrecords.directory;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.os.Build;

/** Receives the package installer result for a Family Records self-update. */
public class ApkInstallReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = readConfirmIntent(intent);
            if (confirm != null) {
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirm);
            }
            AppUpdatePlugin.emitInstallStatus("confirm");
            return;
        }
        if (status == PackageInstaller.STATUS_SUCCESS) {
            AppUpdatePlugin.emitInstallStatus("success");
            return;
        }
        AppUpdatePlugin.emitInstallStatus("failed");
    }

    private static Intent readConfirmIntent(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent.class);
        }
        return intent.getParcelableExtra(Intent.EXTRA_INTENT);
    }
}
