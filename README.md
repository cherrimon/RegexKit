# RegexKit

a simple regex tool for development and testing.

## version 1.0.4
* migrate from manifest v2 to v3.
* removed persisent in background script.

## version 1.0.3
* clean up unnecessary code
* added .gitignore
* allowed to send empty pattern to remove highlights

## version 1.0.2
* 1st version working with chrome

## version 1.0.1
* variables saved in background reuses among tabs.
* disable case-insensitive search
* improved highlight function
* storage for history added
* renamed variables

## version 1.0.0
This extension includes:

* a browser action with a popup including HTML, CSS, and JS
* a background script
* a content script

This tool allows to search regex with affix. The content script will search the whole HTML and highlighted the matched if possible. The search result (with captured groups) will then be sent to popup.