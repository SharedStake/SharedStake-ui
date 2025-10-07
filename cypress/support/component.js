// ***********************************************************
// This file is processed and loaded automatically before
// component test files.
// ***********************************************************

// Import commands.js
import './commands'

// Import mount from Cypress Vue
import { mount } from 'cypress/vue2'

// Make mount available globally
Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(MyComponent)