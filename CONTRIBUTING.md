# Contributing to Firebolt Late Materialization Demo

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Node.js version, browser)
- Screenshots if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please create an issue with:

- A clear, descriptive title
- Detailed description of the proposed enhancement
- Rationale for why this enhancement would be useful
- Examples of how it would work

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issues when applicable (e.g., "Fixes #123")

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of the changes
   - Link to any related issues
   - Include screenshots for UI changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/firebolt-late-materialization-demo.git
cd firebolt-late-materialization-demo

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your Firebolt credentials

# Start development server
npm run dev
```

## Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Run `npm run lint` before committing
- **Components**: Use functional components with hooks
- **Naming**: Use descriptive, camelCase names for variables and functions

## Project Structure

```
firebolt-late-materialization-demo/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   └── page.tsx     # Main page
├── components/      # React components
├── lib/             # Utility functions and types
└── scripts/         # SQL scripts
```

## Testing

Before submitting a PR:

1. **Build test**: `npm run build`
2. **Type check**: `npx tsc --noEmit`
3. **Lint**: `npm run lint`
4. **Manual test**: Test your changes in a browser

## Documentation

- Update README.md if you add features
- Add JSDoc comments for complex functions
- Update the SQL scripts if changing the data model

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome constructive feedback
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Questions?

If you have questions, feel free to:

- Open an issue with the "question" label
- Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

