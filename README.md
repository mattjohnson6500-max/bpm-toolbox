# Private Preview

A password-protected preview site, published with GitHub Pages.

`index.html` holds the page in encrypted form only. Visitors enter the password, and the page is decrypted in their own browser. Without the password, the file contains nothing readable, so it's safe in a public repository.

## Updating the preview

The readable source is kept outside this repository. To publish a new version:

```sh
node tools/lock.mjs <source.html> <password> > index.html
```

Then commit and push `index.html`. GitHub Pages republishes within a minute or two. Changing the password means re-running the command with the new one and sending reviewers the new password.
