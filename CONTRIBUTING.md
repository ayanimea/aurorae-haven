# Contributing to Aurorae Haven

Thank you for your interest in contributing to Aurorae Haven! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Prioritize accessibility, security, and privacy
- Maintain the calm, neurodivergent-friendly aesthetic

## How to Contribute

### Reporting Issues

- Use the GitHub issue tracker
- Provide clear descriptions with steps to reproduce
- Include browser/device information for bugs
- Check existing issues before creating new ones

### Pull Requests

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/my-stellar-trail.git
   cd aurorae-haven
   ```

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Pre-commit Hook (Recommended)**

   To automatically enforce Schedule UI guardrails and prevent regressions:

   ```bash
   cp scripts/pre-commit-schedule-guardrails.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

   This hook blocks commits that violate Schedule UI design rules. See:
   - `docs/schedule-ui-spec.md` - Schedule UI specification
   - `COPILOT_SCHEDULE_ONLY.md` - AI/Copilot guidelines for Schedule UI

4. **Make Changes**
   - Follow the coding standards in `.github/copilot-instructions.md`
   - Keep changes focused and minimal
   - Run linters before committing: `npm run lint && npm run format`
   - Fix ALL linting errors and format issues
   - Test thoroughly in multiple browsers

5. **Commit**

   ```bash
   git commit -m "✨ Add feature description"
   ```

   Use conventional commit prefixes:
   - ✨ `feat:` - New feature
   - 🐛 `fix:` - Bug fix
   - 📝 `docs:` - Documentation
   - ♻️ `refactor:` - Code refactoring
   - ✅ `test:` - Adding tests
   - 🔒 `security:` - Security improvements

6. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a pull request on GitHub

## Development Standards

### Security (CRITICAL)

- **NEVER** use inline scripts or styles (CSP violation)
- All JavaScript in external `.js` files
- All CSS in external `.css` files
- Validate and sanitize all user input
- No `eval()` or `Function()` usage
- **ZERO** npm vulnerabilities in production dependencies
- **ZERO** HIGH/CRITICAL vulnerabilities in dev dependencies
- Run `npm audit` before every commit
- All security vulnerabilities MUST be resolved before PR merge

### Code Quality & Linting (CRITICAL)

**All code MUST pass linting before merge:**

Linting applies to **ALL files containing code**, not just JavaScript:

- **ESLint**: JavaScript/JSX code quality and style
- **Prettier**: Consistent code formatting (all file types including YAML/JSON)
- **StyleLint**: CSS/SCSS validation
- **MarkdownLint**: Markdown documentation quality
- **HTMLHint**: HTML validation (via Super-Linter in CI)
- **Super-Linter**: Auto-validates all file types in CI/CD

**Required Commands:**

Note: `npm run lint` only lints JavaScript/TypeScript files. For other file types, use the commands below:

```bash
# Check JavaScript/TypeScript linting (works now)
npm run lint

# Auto-fix JavaScript/TypeScript linting issues (works now)
npm run lint -- --fix

# Lint other file types (once tools installed)
npx stylelint "**/*.css"           # CSS files
npx markdownlint "**/*.md"         # Markdown files

# Format all files including YAML/JSON (requires installing prettier)
npm run format

# Check formatting without changes (requires prettier)
npm run format -- --check
```

**Installation (if tools missing):**

```bash
# Install all linting tools
npm install --save-dev prettier stylelint markdownlint-cli
```

**Clean Environment (recommended before testing):**

```bash
# Clean up dependencies
rm -rf node_modules package-lock.json
```

**Standards:**

- **ZERO** ESLint errors in new/modified code
- Maximum 20 ESLint warnings allowed in legacy code only
- All files must be formatted with Prettier
- No CSP violations (enforced by linters and CI)
- Fix linting issues file-by-file, systematically

**Linter Configuration:**

All linter configuration files are located in the **repository root directory**:

- `.eslintrc.json` - ESLint rules for JavaScript/JSX
- `.prettierrc.json` - Prettier formatting rules
- `.stylelintrc.json` - StyleLint rules for CSS/SCSS
- `.markdownlint.json` - MarkdownLint rules
- `.htmlhintrc` - HTMLHint rules for HTML validation
- `.jscpd.json` - Copy-paste detection configuration
- `.textlintrc` - Text linting configuration

**Important**: Do NOT create duplicate configs in `.github/linters/`. Super-Linter will automatically use the root configs.

**Super-Linter Integration:**

Our CI uses GitHub Super-Linter to enforce these standards automatically. Before pushing:

1. Run linters locally to catch issues early
2. Fix all errors and warnings in your changed files
3. Verify CI workflows pass (check GitHub Actions tab)
4. If CI fails, read the logs and fix reported issues

### Accessibility (WCAG 2.2 AA)

- Use semantic HTML5 elements
- Provide ARIA labels for interactive elements
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Test with screen readers

### Code Style

**JavaScript:**

- Use ES6 modules (`import`/`export`)
- Use `const` by default, `let` when needed, avoid `var`
- Arrow functions for callbacks
- Template literals for strings
- Meaningful variable names

**HTML:**

- Semantic elements (`<main>`, `<nav>`, `<article>`, etc.)
- Include `lang` attribute on `<html>`
- Add viewport meta tag
- Mark internal links with `data-nav="internal"`

**CSS:**

- Mobile-first responsive design
- Use CSS custom properties for tokens
- Relative units (rem, em, %) over pixels
- Maintain calm, low-contrast visuals
- Respect `prefers-reduced-motion` and `prefers-color-scheme`

### Testing

Before submitting:

1. Test in Chrome, Firefox, Edge, Safari
2. Verify keyboard navigation
3. Check browser console for errors
4. Validate CSP compliance (no violations)
5. Test data export/import functionality
6. Verify responsive design on mobile

## Project Structure

```text
/
├── index.html              # Main entry point
├── public/
│   ├── index.html         # Landing page
│   └── pages/             # Feature pages
├── src/
│   ├── main.js            # Core logic
│   └── assets/styles/     # CSS files
└── .github/
    ├── copilot-instructions.md  # Full coding standards
    └── workflows/               # CI/CD

## CI/CD Workflows

The repository uses automated workflows to ensure code quality:

### Repository Guardrails (`.github/workflows/repo-guardrails.yml`)

Runs on every pull request and checks:

- **Meta checks**: Required files exist (README, CONTRIBUTING, Copilot instructions)
- **Markdown links**: All documentation links are valid
- **Super-Linter**: Comprehensive linting of all code
- **Gitleaks**: Secret scanning to prevent credential leaks
- **Node security**: npm audit and test execution

**All checks MUST pass before merge.**

### Build & Deploy (`.github/workflows/upload-pages-artifact.yml`)

Runs on push to `main`, `feature-*`, or `hotfix-*` branches:

1. **Test**: Run linters, tests, and security audits
2. **Build**: Create production bundle in `dist/`
3. **Deploy**: Publish to GitHub Pages

**If any step fails, deployment is blocked.**

### Monitoring Workflow Logs

When CI fails:

1. Go to GitHub Actions tab
2. Click on the failed workflow run
3. Read the logs to identify specific issues
4. Fix issues file-by-file
5. Push fixes and verify CI passes

**Common Issues:**

- Linting errors: Run `npm run lint -- --fix`
- Formatting issues: Run `npm run format`
- Security vulnerabilities: Run `npm audit` and update packages
- Test failures: Run `npm test` locally and debug
- Build failures: Run `npm run build` locally to reproduce

## Feature Development

When adding new features:

1. Create HTML page in `public/pages/` if needed
2. Create corresponding JS module in `src/`
3. Include CSP meta tag in HTML
4. Implement export/import for data structures
5. Add to navigation with `data-nav="internal"`
6. Update data version if schema changes
7. Test data persistence
8. **Run all linters and tests**
9. **Verify npm audit shows zero vulnerabilities**
10. **Ensure CI workflows pass**

## Documentation

- Update README.md for user-facing changes
- Update ROADMAP.md for feature planning
- Add inline comments for complex logic only
- Follow existing documentation style

## Contributing Templates

Want to add predefined task or routine templates to help users get started?

Templates are stored in `src/data/templates/` as JSON files. See existing templates for the schema structure, validation requirements, and testing guidelines. Submit a PR with your new template following the same pattern.

Quick summary:

1. Create a new JSON file in `src/data/templates/` (e.g., `task-my-template.json`)
2. Register it in `src/utils/predefinedTemplates.js` (add import + array entry)
3. Follow the JSON schema (see guide for details)
4. Test locally by clearing IndexedDB and reloading
5. Run linters: `npm run lint && npm run format`
6. Submit PR with clear description

## Getting Help

- Check [README.md](./README.md) for project overview
- Review [ROADMAP.md](./ROADMAP.md) for planned features
- Read [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for detailed standards
- Open a discussion on GitHub for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
```
