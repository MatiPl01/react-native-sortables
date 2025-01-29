# Contributing to React Native Sortables

Thank you for your interest in contributing to React Native Sortables! Contributions are welcome in the following forms:

- Reporting a bug
- Submitting a fix
- Proposing new features

## Issues and Bug Reports

### Creating Issues

Bugs and feature requests can be reported through GitHub issues by [opening a new issue](https://github.com/MatiPl01/react-native-sortables/issues).

### Writing Bug Reports

A helpful bug report should include:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Pull Requests

### Development Process

This project uses GitHub to host code, track issues and feature requests, and accept pull requests.

1. Fork the repo and create your branch from `main`
2. Clone your forked repo
3. Set up the development environment:
   - Run `yarn` in the repo root to install dependencies
   - For iOS: Run `yarn example:fabric pod`
4. Start development:
   - Run `yarn example:fabric start` to start metro bundler
   - Build project:
     - Using IDE: Open in Xcode/Android Studio
     - Using command line:
       - Android: `yarn example:fabric android`
       - iOS: `yarn example:fabric ios`
5. Make your changes
6. If you've changed APIs, update the documentation
7. Make sure your code lints
8. Update the example project if needed
9. Submit that pull request!

> [!TIP]  
> All example commands shown above can also be run with the **Old Architecture (Paper)** example app by replacing `example:fabric` with `example:paper` in the commands.

## Discussions

For proposing new features or discussing ideas, please use [GitHub Discussions](https://github.com/MatiPl01/react-native-sortables/discussions). This is a great place to:

- Share your ideas for new features
- Discuss potential improvements
- Ask questions about the library's usage

Before creating a new discussion:

1. Check if a similar discussion already exists
2. Choose the appropriate discussion category
3. For feature proposals: describe the problem and use cases, you can also propose a solution
4. For questions: make sure your question is clear and specific

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](http://choosealicense.com/licenses/mit/).
