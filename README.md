# Watch Face Format Build Script

This is a Microsoft Windows batch file to help with building [Google-Samsung Watch Face Format (WFF)](https://developer.android.com/training/wearables/wff) projects.

As a minimum, it builds the watchface and installs it on a connected Wear OS device or Android Virtual Device (AVD).

It can optionally use these tools:

* [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor)

* [WFF XML XSD Validator](https://github.com/google/watchface/blob/main/third_party/wff/README.md)

* [memory footprint evaluator](https://github.com/google/watchface/tree/main/play-validations).

The script can't build signed release bundles suitable for uploading to [Google Play Console](https://play.google.com/console).

## Prerequisites

This script has only been tested in conjunction with an [*Android Studio*](https://developer.android.com/studio/intro) installation. *Android Studio* provides an XML editor, Java, gradle, ADB, AVD and command line. If you don't want to use *Android Studio*, you'll need to set up a development environment that provides those capabilities.

The script assumes WFF Version 2, and has been tested with SDK 33 and 34 on Wear OS 4 and 5.

You'll need a WFF project folder and files. If you haven't already got one, here are some ways of starting:

* Google's [instructions](https://developer.android.com/training/wearables/wff/setup).

* Google's [samples](https://github.com/android/wear-os-samples/tree/main/WatchFaceFormat).

* Adapt the [WFF Boilerplate repository](https://github.com/gondwanasoft/wff-boilerplate).

* [Samsung's Watch Face Studio](https://developer.samsung.com/watch-face-studio/overview.html). You can extract most files that you need from a  `.wfs` file:
   * 'Publish' the project in WFS.
   * Find the resulting `.aab` file in `build\[project]`.
   * Append `.zip` to the `.aab` file's name.
   * From the `.zip`, copy `base\res\raw\watchface.xml`.
   * From the `.zip`, copy necessary resources (*eg*, images) from `base\res\drawable-nodpi-v4`.
   * Copy or create other essential files. If in doubt, refer to the sources above.
   * Restore the `.aab` file's name by removing the `.zip`.
   * Use a code editor to reformat `watchface.xml` to make it easier to read.

## Installation

Put `build.bat` in your WFF project folder (*ie*, with `gradlew.bat`).

Create a `wff-build-tools` folder at the same level as your project folders (*ie*, it should be reachable via `..\wff-build-tools` from folders containing `gradlew.bat`).

Put `set-env.bat` into  `wff-build-tools`. (`set-env.bat` sets Windows environment variables that may be needed by `build.bat`.)

If you want to use the [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor):

* Save your `watchface\src\main\res\raw\watchface.xml` file somewhere safe, because the preprocessor will probably overwrite it.

* Put your preprocessor input in `watchface\watchface-pp.xml`. If this file exists, `build.bat` will use the preprocessor to create `watchface\src\main\res\raw\watchface.xml` prior to building; if `watchface-pp.xml` doesn't exist, `build.bat` will build the watchface from the extant `watchface.xml`.

* Put [`preprocess.py`](https://github.com/gondwanasoft/xml-preprocessor) into `wff-build-tools`.

If you want WFF XML XSD validation:

* [Build `dwf-format-2-validator-1.0.jar`](https://github.com/google/watchface/blob/main/third_party/wff/README.md) or [download it](https://github.com/google/watchface/releases/tag/latest).

* Put `dwf-format-2-validator-1.0.jar` into `wff-build-tools`.

If you want memory footprint evaluation:

* [Build `memory-footprint.jar`](https://github.com/google/watchface/tree/main/play-validations) or [download it](https://github.com/google/watchface/releases/tag/latest).

* Put `memory-footprint.jar` into `wff-build-tools`.

## Usage

Connect or start a suitable Wear OS device or AVD. If you're using a physical watch, turn on debugging. The device needs to be accessible via ADB.

> **WARNING:** If you're using [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor), take precautions against the preprocessor overwriting your `watchface.xml` file.

From a command prompt, run `build.bat`. If there are build-time errors, they'll be reported; otherwise, the watchface will be installed on the connected device.

Installation and runtime errors (*eg*, bad XML, missing resources) can be seen in the logcat against `com.google.wear.watchface.runtime`. If you're not using *Android Studio*, try:

    adb logcat --pid=$(adb shell pidof -s com.google.wear.watchface.runtime)

If you're using [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor), `build.bat` will normally delete the `watchface.xml` file it creates if the build is successful. This avoids confusing search results in *Android Studio* (*etc*). If you want to retain `watchface.xml` (*eg*, to help with debugging), use `build.bat -d`.

#### Command-line Options

* `-d` debug mode: if [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor) is being used, passes `-d` to the preprocessor for extra output and retains `watchface.xml` after building the watchface.

* `-m` invoke [memory footprint evaluator](https://github.com/google/watchface/tree/main/play-validations) instead of installing.

## Limitations

`build.bat` can require the `JAVA_HOME` and `ANDROID_HOME` environment variables to be set correctly. `set-env.bat` simplistically attempts to ensure this. If it fails, set the required variables manually.

`build.bat` can't build signed release bundles suitable for uploading to [Google Play Console](https://play.google.com/console). You can do this as follows:

* If you're using [XML Preprocessor](https://github.com/gondwanasoft/xml-preprocessor), use `build.bat`'s `-d` command-line option to prevent deletion of `watchface.xml`.

* In *Android Studio*, select `Build` > `build App Bundle(s) / APK(s)` > `Build Bundle(s)`. This should create `watchface\release\watchface-release.aab`. This should be acceptable to [Google Play Console](https://play.google.com/console) if you use *Google Play* to sign the release.

`build.bat` has only been tested in an environment with *Android Studio* installed. If you don't want *Android Studio*:

* Any text editor can be used to edit the XML and config files. *Visual Studio Code* is recommended.

* Instead of using gradle directly, you could use the WFS-provided `bundletool`.

* `adb` is available from WFS installation (*eg*, `%LOCALAPPDATA%\Programs\WatchFaceStudio\tools\window\adb.exe`).

* Android emulators can be run independently of *Android Studio*, but it might be easier to use a real watch.

* [This site](https://nthn.uk/blog/wfs) describes an equivalent process that doesn’t require *Android Studio*.


## Acknowledgements

* [Google's Watch Face Format Sample repository](https://github.com/android/wear-os-samples/tree/main/WatchFaceFormat)

* [Google's WFF XML XSD Validator](https://github.com/google/watchface/blob/main/third_party/wff/README.md)

* [Google's memory footprint evaluator](https://github.com/google/watchface/tree/main/play-validations)