Allows to manage the mute state of a group (or all) tabs to only keep the
currently focused one of the group unmuted and mute the others. Quick-Change via
Toolbar Button and permanent ex/inclusion via preferences

[![](https://raw.githubusercontent.com/igorlogius/igorlogius/main/geFxAddon.png)](https://addons.mozilla.org/firefox/addon/mute-unfocused-tabs/)

### [Click here to report a bug, make a suggestion or ask a question](https://github.com/igorlogius/igorlogius/issues/new/choose)

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
    click the toolbar icon, to toggle the manage or unmanaged state of each tab.
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
