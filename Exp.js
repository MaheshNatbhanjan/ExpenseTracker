// FinSight - Pro Expense Intelligence
// Main Application JavaScript

class FinSightApp {
  constructor() {
    this.transactions = JSON.parse(localStorage.getItem("finsight_transactions")) || []
    this.budget = JSON.parse(localStorage.getItem("finsight_budget")) || { limit: 0 }
    this.theme = localStorage.getItem("finsight_theme") || "light"
    this.currentEditId = null

    this.categories = {
      expense: [
        { name: "Food & Dining", icon: "🍽️" },
        { name: "Transportation", icon: "🚗" },
        { name: "Shopping", icon: "🛍️" },
        { name: "Entertainment", icon: "🎬" },
        { name: "Bills & Utilities", icon: "💡" },
        { name: "Healthcare", icon: "🏥" },
        { name: "Education", icon: "📚" },
        { name: "Travel", icon: "✈️" },
        { name: "Insurance", icon: "🛡️" },
        { name: "Other", icon: "📦" },
      ],
      income: [
        { name: "Salary", icon: "💼" },
        { name: "Freelance", icon: "💻" },
        { name: "Investment", icon: "📈" },
        { name: "Business", icon: "🏢" },
        { name: "Gift", icon: "🎁" },
        { name: "Other", icon: "💰" },
      ],
    }

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupTheme()
    this.updateGreeting()
    this.populateCategories()
    this.updateDashboard()
    this.renderTransactions()
    this.updateBudgetDisplay()

    // Set default date to today
    document.getElementById("transactionDate").value = new Date().toISOString().split("T")[0]
  }

  setupEventListeners() {
    // Navigation
    document.getElementById("sidebarToggle").addEventListener("click", () => this.toggleSidebar())
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme())

    // Menu navigation
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", (e) => this.navigateToSection(e))
    })

    document.querySelectorAll(".view-all").forEach((item) => {
      item.addEventListener("click", (e) => this.navigateToSection(e))
    })

    // Transaction modal
    document.getElementById("addTransactionBtn").addEventListener("click", () => this.openTransactionModal())
    document.getElementById("addTransactionBtn2").addEventListener("click", () => this.openTransactionModal())
    document.getElementById("modalClose").addEventListener("click", () => this.closeTransactionModal())
    document.getElementById("cancelBtn").addEventListener("click", () => this.closeTransactionModal())
    document.getElementById("transactionForm").addEventListener("submit", (e) => this.handleTransactionSubmit(e))

    // Transaction type change
    document.getElementById("transactionType").addEventListener("change", () => this.updateCategoryOptions())

    // Filters
    document.getElementById("searchInput").addEventListener("input", () => this.applyFilters())
    document.getElementById("categoryFilter").addEventListener("change", () => this.applyFilters())
    document.getElementById("typeFilter").addEventListener("change", () => this.applyFilters())
    document.getElementById("dateFromFilter").addEventListener("change", () => this.applyFilters())
    document.getElementById("dateToFilter").addEventListener("change", () => this.applyFilters())
    document.getElementById("clearFilters").addEventListener("click", () => this.clearFilters())

    // Budget
    document.getElementById("setBudgetBtn").addEventListener("click", () => this.setBudget())

    // Export
    document.getElementById("exportCSV").addEventListener("click", () => this.exportToCSV())
    document.getElementById("printReport").addEventListener("click", () => this.printReport())

    // Modal overlay click
    document.getElementById("transactionModal").addEventListener("click", (e) => {
      if (e.target.id === "transactionModal") {
        this.closeTransactionModal()
      }
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTransactionModal()
      }
    })
  }

  setupTheme() {
    document.documentElement.setAttribute("data-theme", this.theme)
    const themeIcon = document.querySelector(".theme-icon")
    themeIcon.textContent = this.theme === "dark" ? "☀️" : "🌙"
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light"
    localStorage.setItem("finsight_theme", this.theme)
    this.setupTheme()
    this.showToast("Theme changed successfully!", "success")
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    sidebar.classList.toggle("active")
  }

  updateGreeting() {
    const now = new Date()
    const hour = now.getHours()
    let greeting = "Good Evening!"

    if (hour < 12) {
      greeting = "Good Morning!"
    } else if (hour < 18) {
      greeting = "Good Afternoon!"
    }

    document.getElementById("userGreeting").textContent = greeting
  }

  navigateToSection(e) {
    e.preventDefault()
    const targetSection = e.target.closest("[data-section]").dataset.section

    // Update active menu item
    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"))
    document.querySelectorAll(`[data-section="${targetSection}"]`).forEach((item) => {
      if (item.classList.contains("menu-item")) {
        item.classList.add("active")
      }
    })

    // Show target section
    document.querySelectorAll(".content-section").forEach((section) => section.classList.remove("active"))
    document.getElementById(targetSection).classList.add("active")

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById("sidebar").classList.remove("active")
    }
  }

  populateCategories() {
    const categorySelect = document.getElementById("transactionCategory")
    const categoryFilter = document.getElementById("categoryFilter")

    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category</option>'
    categoryFilter.innerHTML = '<option value="">All Categories</option>'

    // Add all categories
    ;[...this.categories.expense, ...this.categories.income].forEach((category) => {
      const option1 = new Option(category.name, category.name)
      const option2 = new Option(category.name, category.name)
      categoryFilter.appendChild(option1)
    })
  }

  updateCategoryOptions() {
    const type = document.getElementById("transactionType").value
    const categorySelect = document.getElementById("transactionCategory")

    categorySelect.innerHTML = '<option value="">Select Category</option>'

    if (type && this.categories[type]) {
      this.categories[type].forEach((category) => {
        const option = new Option(category.name, category.name)
        categorySelect.appendChild(option)
      })
    }
  }

  openTransactionModal(transaction = null) {
    const modal = document.getElementById("transactionModal")
    const modalTitle = document.getElementById("modalTitle")
    const form = document.getElementById("transactionForm")

    if (transaction) {
      modalTitle.textContent = "Edit Transaction"
      this.currentEditId = transaction.id
      this.populateForm(transaction)
    } else {
      modalTitle.textContent = "Add Transaction"
      this.currentEditId = null
      form.reset()
      document.getElementById("transactionDate").value = new Date().toISOString().split("T")[0]
    }

    this.clearFormErrors()
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  closeTransactionModal() {
    const modal = document.getElementById("transactionModal")
    modal.classList.remove("active")
    document.body.style.overflow = ""
    this.currentEditId = null
    this.clearFormErrors()
  }

  populateForm(transaction) {
    document.getElementById("transactionTitle").value = transaction.title
    document.getElementById("transactionAmount").value = transaction.amount
    document.getElementById("transactionType").value = transaction.type
    document.getElementById("transactionDate").value = transaction.date
    document.getElementById("transactionNotes").value = transaction.notes || ""

    this.updateCategoryOptions()
    setTimeout(() => {
      document.getElementById("transactionCategory").value = transaction.category
    }, 100)
  }

  handleTransactionSubmit(e) {
    e.preventDefault()

    const formData = {
      title: document.getElementById("transactionTitle").value.trim(),
      amount: Number.parseFloat(document.getElementById("transactionAmount").value),
      type: document.getElementById("transactionType").value,
      category: document.getElementById("transactionCategory").value,
      date: document.getElementById("transactionDate").value,
      notes: document.getElementById("transactionNotes").value.trim(),
    }

    if (this.validateForm(formData)) {
      if (this.currentEditId) {
        this.updateTransaction(this.currentEditId, formData)
      } else {
        this.addTransaction(formData)
      }
    }
  }

  validateForm(data) {
    this.clearFormErrors()
    let isValid = true

    if (!data.title) {
      this.showFieldError("titleError", "Title is required")
      isValid = false
    }

    if (!data.amount || data.amount <= 0) {
      this.showFieldError("amountError", "Amount must be greater than 0")
      isValid = false
    }

    if (!data.type) {
      this.showFieldError("typeError", "Type is required")
      isValid = false
    }

    if (!data.category) {
      this.showFieldError("categoryError", "Category is required")
      isValid = false
    }

    if (!data.date) {
      this.showFieldError("dateError", "Date is required")
      isValid = false
    }

    return isValid
  }

  showFieldError(fieldId, message) {
    document.getElementById(fieldId).textContent = message
  }

  clearFormErrors() {
    document.querySelectorAll(".error-message").forEach((error) => {
      error.textContent = ""
    })
  }

  addTransaction(data) {
    const transaction = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    }

    this.transactions.unshift(transaction)
    this.saveTransactions()
    this.updateDashboard()
    this.renderTransactions()
    this.updateBudgetDisplay()
    this.closeTransactionModal()
    this.showToast("Transaction added successfully!", "success")
  }

  updateTransaction(id, data) {
    const index = this.transactions.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.transactions[index] = { ...this.transactions[index], ...data }
      this.saveTransactions()
      this.updateDashboard()
      this.renderTransactions()
      this.updateBudgetDisplay()
      this.closeTransactionModal()
      this.showToast("Transaction updated successfully!", "success")
    }
  }

  deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id)
      this.saveTransactions()
      this.updateDashboard()
      this.renderTransactions()
      this.updateBudgetDisplay()
      this.showToast("Transaction deleted successfully!", "success")
    }
  }

  saveTransactions() {
    localStorage.setItem("finsight_transactions", JSON.stringify(this.transactions))
  }

  updateDashboard() {
    const totalIncome = this.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = this.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const totalBalance = totalIncome - totalExpenses

    document.getElementById("totalBalance").textContent = this.formatCurrency(totalBalance)
    document.getElementById("totalIncome").textContent = this.formatCurrency(totalIncome)
    document.getElementById("totalExpenses").textContent = this.formatCurrency(totalExpenses)

    // Update balance card color
    const balanceCard = document.querySelector(".balance-card .amount")
    balanceCard.className = `amount ${totalBalance >= 0 ? "income" : "expense"}`

    this.renderRecentTransactions()
  }

  renderRecentTransactions() {
    const container = document.getElementById("recentTransactions")
    const recentTransactions = this.transactions.slice(0, 5)

    if (recentTransactions.length === 0) {
      container.innerHTML =
        '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No transactions yet. Add your first transaction to get started!</p>'
      return
    }

    container.innerHTML = recentTransactions
      .map(
        (transaction) => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${this.getCategoryIcon(transaction.category)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-meta">${transaction.category} • ${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === "income" ? "+" : "-"}${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `,
      )
      .join("")
  }

  renderTransactions() {
    const container = document.getElementById("transactionsList")
    let filteredTransactions = [...this.transactions]

    // Apply filters
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    const categoryFilter = document.getElementById("categoryFilter").value
    const typeFilter = document.getElementById("typeFilter").value
    const dateFromFilter = document.getElementById("dateFromFilter").value
    const dateToFilter = document.getElementById("dateToFilter").value

    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.title.toLowerCase().includes(searchTerm) || (t.notes && t.notes.toLowerCase().includes(searchTerm)),
      )
    }

    if (categoryFilter) {
      filteredTransactions = filteredTransactions.filter((t) => t.category === categoryFilter)
    }

    if (typeFilter) {
      filteredTransactions = filteredTransactions.filter((t) => t.type === typeFilter)
    }

    if (dateFromFilter) {
      filteredTransactions = filteredTransactions.filter((t) => t.date >= dateFromFilter)
    }

    if (dateToFilter) {
      filteredTransactions = filteredTransactions.filter((t) => t.date <= dateToFilter)
    }

    if (filteredTransactions.length === 0) {
      container.innerHTML =
        '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No transactions found matching your criteria.</p>'
      return
    }

    container.innerHTML = filteredTransactions
      .map(
        (transaction) => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${this.getCategoryIcon(transaction.category)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-meta">
                        ${transaction.category} • ${this.formatDate(transaction.date)}
                        ${transaction.notes ? ` • ${transaction.notes}` : ""}
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === "income" ? "+" : "-"}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="action-btn edit" onclick="app.editTransaction('${transaction.id}')">✏️</button>
                    <button class="action-btn delete" onclick="app.deleteTransaction('${transaction.id}')">🗑️</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  editTransaction(id) {
    const transaction = this.transactions.find((t) => t.id === id)
    if (transaction) {
      this.openTransactionModal(transaction)
    }
  }

  applyFilters() {
    this.renderTransactions()
  }

  clearFilters() {
    document.getElementById("searchInput").value = ""
    document.getElementById("categoryFilter").value = ""
    document.getElementById("typeFilter").value = ""
    document.getElementById("dateFromFilter").value = ""
    document.getElementById("dateToFilter").value = ""
    this.renderTransactions()
  }

  setBudget() {
    const budgetLimit = Number.parseFloat(document.getElementById("budgetLimit").value)

    if (!budgetLimit || budgetLimit <= 0) {
      this.showToast("Please enter a valid budget amount", "error")
      return
    }

    this.budget.limit = budgetLimit
    localStorage.setItem("finsight_budget", JSON.stringify(this.budget))
    this.updateBudgetDisplay()
    this.showToast("Budget limit set successfully!", "success")
  }

  updateBudgetDisplay() {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyExpenses = this.transactions
      .filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          t.type === "expense" &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const budgetPercentage = this.budget.limit > 0 ? (monthlyExpenses / this.budget.limit) * 100 : 0

    // Update dashboard budget card
    const budgetProgressElement = document.getElementById("budgetProgress")
    const budgetPercentageElement = document.getElementById("budgetPercentage")

    if (budgetProgressElement && budgetPercentageElement) {
      budgetPercentageElement.textContent = `${Math.round(budgetPercentage)}%`
      budgetProgressElement.style.background = `conic-gradient(var(--primary-color) ${budgetPercentage * 3.6}deg, var(--bg-tertiary) 0deg)`

      if (budgetPercentage > 100) {
        budgetProgressElement.style.background = `conic-gradient(var(--danger-color) ${budgetPercentage * 3.6}deg, var(--bg-tertiary) 0deg)`
      }
    }

    // Update budget page
    const budgetSpent = document.getElementById("budgetSpent")
    const budgetTotal = document.getElementById("budgetTotal")
    const budgetFill = document.getElementById("budgetFill")
    const budgetLimitInput = document.getElementById("budgetLimit")

    if (budgetSpent) budgetSpent.textContent = this.formatCurrency(monthlyExpenses)
    if (budgetTotal) budgetTotal.textContent = this.formatCurrency(this.budget.limit)
    if (budgetLimitInput) budgetLimitInput.value = this.budget.limit || ""

    if (budgetFill) {
      budgetFill.style.width = `${Math.min(budgetPercentage, 100)}%`
      if (budgetPercentage > 90) {
        budgetFill.style.background = "var(--danger-color)"
      } else if (budgetPercentage > 75) {
        budgetFill.style.background = "var(--warning-color)"
      } else {
        budgetFill.style.background = "var(--primary-gradient)"
      }
    }
  }

  exportToCSV() {
    if (this.transactions.length === 0) {
      this.showToast("No transactions to export", "warning")
      return
    }

    const headers = ["Date", "Title", "Type", "Category", "Amount", "Notes"]
    const csvContent = [
      headers.join(","),
      ...this.transactions.map((t) =>
        [t.date, `"${t.title}"`, t.type, `"${t.category}"`, t.amount, `"${t.notes || ""}"`].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finsight-transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    this.showToast("Transactions exported successfully!", "success")
  }

  printReport() {
    window.print()
  }

  getCategoryIcon(categoryName) {
    const allCategories = [...this.categories.expense, ...this.categories.income]
    const category = allCategories.find((cat) => cat.name === categoryName)
    return category ? category.icon : "📦"
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    }

    toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `

    toastContainer.appendChild(toast)

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100)

    // Remove toast after 4 seconds
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }
}

// Initialize the application
const app = new FinSightApp()

// Service Worker Registration for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    document.getElementById("sidebar").classList.remove("active")
  }
})

// Prevent form submission on Enter key in search inputs
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.classList.contains("filter-input")) {
    e.preventDefault()
  }
})

// Auto-save functionality for budget input
let budgetTimeout
document.getElementById("budgetLimit").addEventListener("input", () => {
  clearTimeout(budgetTimeout)
  budgetTimeout = setTimeout(() => {
    const value = Number.parseFloat(document.getElementById("budgetLimit").value)
    if (value > 0) {
      app.budget.limit = value
      localStorage.setItem("finsight_budget", JSON.stringify(app.budget))
      app.updateBudgetDisplay()
    }
  }, 1000)
})

// Add smooth scrolling for better UX
document.documentElement.style.scrollBehavior = "smooth"

// Handle offline functionality
window.addEventListener("online", () => {
  app.showToast("You are back online!", "success")
})

window.addEventListener("offline", () => {
  app.showToast("You are now offline. Data will be saved locally.", "warning")
})

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + N for new transaction
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault()
    app.openTransactionModal()
  }

  // Ctrl/Cmd + E for export
  if ((e.ctrlKey || e.metaKey) && e.key === "e") {
    e.preventDefault()
    app.exportToCSV()
  }

  // Ctrl/Cmd + P for print
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault()
    app.printReport()
  }
})

// Add touch gestures for mobile
let touchStartX = 0
let touchEndX = 0

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX
})

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
})

function handleSwipe() {
  const swipeThreshold = 100
  const sidebar = document.getElementById("sidebar")

  if (window.innerWidth <= 768) {
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left - close sidebar
      sidebar.classList.remove("active")
    }

    if (touchEndX > touchStartX + swipeThreshold && touchStartX < 50) {
      // Swipe right from edge - open sidebar
      sidebar.classList.add("active")
    }
  }
}

// Add data validation and sanitization
function sanitizeInput(input) {
  const div = document.createElement("div")
  div.textContent = input
  return div.innerHTML
}

// Add analytics tracking (placeholder for future implementation)
function trackEvent(eventName, eventData) {
  console.log(`Analytics: ${eventName}`, eventData)
  // This would integrate with analytics services like Google Analytics
}

// Add performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "navigation") {
      console.log("Page load time:", entry.loadEventEnd - entry.loadEventStart)
    }
  }
})

if (typeof PerformanceObserver !== "undefined") {
  performanceObserver.observe({ entryTypes: ["navigation"] })
}

// Add error handling and logging
window.addEventListener("error", (e) => {
  console.error("Application error:", e.error)
  app.showToast("An error occurred. Please try again.", "error")
})

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason)
  app.showToast("An error occurred. Please try again.", "error")
})

// Initialize tooltips and help system
function initializeHelp() {
  const helpButtons = document.querySelectorAll("[data-help]")
  helpButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const helpText = e.target.dataset.help
      app.showToast(helpText, "info")
    })
  })
}

// Call help initialization
document.addEventListener("DOMContentLoaded", initializeHelp)

// Add data backup and restore functionality
function backupData() {
  const data = {
    transactions: app.transactions,
    budget: app.budget,
    theme: app.theme,
    timestamp: new Date().toISOString(),
  }

  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `finsight-backup-${new Date().toISOString().split("T")[0]}.json`
  a.click()

  URL.revokeObjectURL(url)
  app.showToast("Data backup created successfully!", "success")
}

function restoreData(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (data.transactions && Array.isArray(data.transactions)) {
        app.transactions = data.transactions
        localStorage.setItem("finsight_transactions", JSON.stringify(data.transactions))
      }

      if (data.budget) {
        app.budget = data.budget
        localStorage.setItem("finsight_budget", JSON.stringify(data.budget))
      }

      if (data.theme) {
        app.theme = data.theme
        localStorage.setItem("finsight_theme", data.theme)
        app.setupTheme()
      }

      app.updateDashboard()
      app.renderTransactions()
      app.updateBudgetDisplay()

      app.showToast("Data restored successfully!", "success")
    } catch (error) {
      app.showToast("Invalid backup file format", "error")
    }
  }
  reader.readAsText(file)
}

// Add data export in multiple formats
function exportToJSON() {
  const data = {
    transactions: app.transactions,
    budget: app.budget,
    exportDate: new Date().toISOString(),
    version: "1.0",
  }

  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `finsight-export-${new Date().toISOString().split("T")[0]}.json`
  a.click()

  URL.revokeObjectURL(url)
  app.showToast("Data exported as JSON successfully!", "success")
}

// Add budget alerts and notifications
function checkBudgetAlerts() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyExpenses = app.transactions
    .filter((t) => {
      const transactionDate = new Date(t.date)
      return (
        t.type === "expense" &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const budgetPercentage = app.budget.limit > 0 ? (monthlyExpenses / app.budget.limit) * 100 : 0

  if (budgetPercentage >= 100) {
    app.showToast("⚠️ Budget exceeded! You have spent more than your monthly limit.", "error")
  } else if (budgetPercentage >= 90) {
    app.showToast("⚠️ Budget warning! You have used 90% of your monthly budget.", "warning")
  } else if (budgetPercentage >= 75) {
    app.showToast("💡 Budget notice: You have used 75% of your monthly budget.", "info")
  }
}

// Check budget alerts when transactions are added
const originalAddTransaction = app.addTransaction.bind(app)
app.addTransaction = (data) => {
  originalAddTransaction(data)
  setTimeout(checkBudgetAlerts, 500)
}

// Add recurring transaction templates
const recurringTemplates = [
  { title: "Monthly Salary", type: "income", category: "Salary", amount: 0 },
  { title: "Rent Payment", type: "expense", category: "Bills & Utilities", amount: 0 },
  { title: "Grocery Shopping", type: "expense", category: "Food & Dining", amount: 0 },
  { title: "Gas Fill-up", type: "expense", category: "Transportation", amount: 0 },
]

// Add quick action buttons for common transactions
function addQuickActions() {
  const quickActionsHTML = `
        <div class="quick-actions" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">Quick Actions</h3>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                ${recurringTemplates
                  .map(
                    (template, index) => `
                    <button class="btn btn-secondary" onclick="app.useTemplate(${index})" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                        ${template.title}
                    </button>
                `,
                  )
                  .join("")}
            </div>
        </div>
    `

  const dashboardSection = document.querySelector("#dashboard .dashboard-section")
  if (dashboardSection) {
    dashboardSection.insertAdjacentHTML("beforebegin", quickActionsHTML)
  }
}

// Add template usage functionality
app.useTemplate = function (templateIndex) {
  const template = recurringTemplates[templateIndex]
  if (template) {
    this.openTransactionModal()
    setTimeout(() => {
      document.getElementById("transactionTitle").value = template.title
      document.getElementById("transactionType").value = template.type
      this.updateCategoryOptions()
      setTimeout(() => {
        document.getElementById("transactionCategory").value = template.category
      }, 100)
    }, 100)
  }
}

// Initialize quick actions after DOM is loaded
setTimeout(addQuickActions, 1000)

console.log("FinSight - Pro Expense Intelligence loaded successfully! 🚀")
