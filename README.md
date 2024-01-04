Allows to manage the mute state of a group (or all) tabs to only keep the
currently focused one of the group unmuted and mute the others. Quick-Change via
Toolbar Button and permanent ex/inclusion via preferences

<b>Short Demo Video:</b>

https://github.com/igorlogius/mute-unfocused-tabs/assets/67047467/8d8e7df5-fe6a-42ae-bf86-309f8e05dff2

<b>Usage: Simple (Automatic Mode) </b>
<ol>
  <li>
    All Tabs are managed, click the toolbar icon, to toggle the manage or
    unmanaged state each tab.
  </li>
  <li>
    The List on the preference page allows to make default exclusions (set
    unmanaged sites/urls via regex) (Sites which you want to hear audio from
    when they are not focused)
  </li>
</ol>

<b>Usage: Advanced (Manual Mode) </b>
<ol>
  <li>Needs to be enabled on the preference page</li>
  <li>All Tabs are now unmanaged</li>
  <li>
    click the toolbar icon, to toggle the manage or unmanaged state each tab.
  </li>
  <li>
    The list on the preference page now allows to make default inclusions (set
    managed sites/urls via regex) (Sites which you dont want to hear audio from
    when they are not focused)
  </li>
</ol>

<b>Sidenote:</b>
If the mute icon on the tabs is annoying to you, you can hide it via
userChrome.css.

<code>.tab-secondary-label[muted] { display: none !important; }</code>

PS: Dont forget to enable the about:config switch that enables it.

<b>Notes:</b>
<ol>
    <li><b>Can/Should  i trust this addon?</b>
        You can view the source code by either visiting the Homepage/Support Site or just saving/downloading the XPI (which is really just a ZIP Archive) and then extract it locally. The Sources in the XPI should be unofuscated and unminified (HTML,CSS and JS), so it's as easy to read as possible. Alternatives you can also use the <a href="https://addons.mozilla.org/en-US/firefox/addon/crxviewer/">CRX Viewer Extension by Rob W</a> to inspect the XPI sources. If you have an questions, you can also open an issue on the support site and i'll try and answer to the best of my abilities.
        If you are no programmer and are still feeling unsure, you might want to visit one of the official or unoffical mozilla communities and ask if someone there with more knowlege can take a look. Examples: https://reddit.com/r/firefox , https://lemmy.world/c/firefox or https://chat.mozilla.org/#/room/#addons:mozilla.org
    </li>
    <li><b>Permissions:</b>
        This add-on tries to use the minimal number of required permissions to successfully fullfill its intended purpose.
        If you think this could be improved please let me know by opening an issue and i will try to look into it.
        More Details on the individual permission can be found here: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions
    </li>
    <li><b>Cost/Payment:</b>
        This Add-on is and forever will be subscription and payment free to use for everyone however they like.
        If you are feeling generous you can send me a tip via my bitcoin address 35WK2GqZHPutywCdbHKa9BQ52GND3Pd6h4
    </li>
    <li><b>Stars/Reviews:</b>
        If you found this add-on useful leave some stars or a review so others have an  easier time finding it.
    </li>
    <li><b>Bugs, Suggestions or Requests:</b>
        If you have any issues (for example a site it does not work but you think it should) or have improvement suggestions or a feature request please open an issue at the Support Site
    </li>
</ol>

