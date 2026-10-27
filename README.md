# Command Stack Assembler

A static, browser-only Java Edition command-block assembler inspired by the layout and two modes of [OCC-GEN](https://command-casual.github.io/OCC-GEN/). This is an independent community rebuild and is not affiliated with or endorsed by Mojang or Microsoft.

## Use locally

Open `index.html` in a browser for **Slow Assemble** or `instant.html` for **Fast Assemble**. The site needs no build step, package installation, API key, or backend. If your browser restricts local clipboard access, the copy button falls back to selecting the generated command for manual copying.

Enter a command, choose its block settings, and watch the output update. Use **Add Another Command Block** to commit it to the ordered stack. In Fast Assemble, set a position for each block before adding it. Use **Remove** to drop a saved block from the stack, or **Clear stack** to reset the editor.

## Host on GitHub Pages

1. Create a **public** GitHub repository so everyone can access the site.
2. Extract this site's files into the repository root. Keep the `assets` folder beside the HTML files; it contains the supplied header logo and PNG favicon. The root should contain `index.html`, `instant.html`, `app.js`, `styles.css`, `assets/commandsss.png`, and `assets/favicon.png`.
3. Open the repository’s **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
5. After GitHub finishes publishing, open `https://<your-username>.github.io/<repository-name>/`. The home page starts in Slow Assemble; the top navigation opens Fast Assemble.

The files use relative asset and page links, so they also work when GitHub Pages serves the project from a repository subpath.
