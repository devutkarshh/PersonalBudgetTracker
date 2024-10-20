document.addEventListener("DOMContentLoaded", () => {
	const expenseForm = document.getElementById("expense-form");
	const expenseList = document.getElementById("expense-list");
	const totalAmount = document.getElementById("total-amount");
	const filterCategory = document.getElementById("filter-category");

	let expenses = [];
	let editingExpenseId = null;

	// Fetch expenses from the server
	async function fetchExpenses() {
		const response = await fetch('/expenses');
		expenses = await response.json();
		displayExpenses(expenses);
		updateTotalAmount();
		updateChart(expenses);
	}

	fetchExpenses();

	expenseForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		const name = document.getElementById("expense-name").value;
		const amount = parseFloat(document.getElementById("expense-amount").value);
		const category = document.getElementById("expense-category").value;
		const date = document.getElementById("expense-date").value;

		const expense = {
			name,
			amount,
			category,
			date
		};

		let response;
		if (editingExpenseId) {
			// Update existing expense
			response = await fetch(`/expenses/${editingExpenseId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(expense)
			});
			const updatedExpense = await response.json();
			expenses = expenses.map(exp => exp._id === updatedExpense._id ? updatedExpense : exp);
			editingExpenseId = null;
		} else {
			// Create new expense
			response = await fetch('/expenses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(expense)
			});
			const newExpense = await response.json();
			expenses.push(newExpense);
		}

		displayExpenses(expenses);
		updateTotalAmount();
		updateChart(expenses);

		expenseForm.reset();
	});

	expenseList.addEventListener("click", async (e) => {
		if (e.target.classList.contains("delete-btn")) {
			const id = e.target.dataset.id;

			await fetch(`/expenses/${id}`, {
				method: 'DELETE'
			});

			expenses = expenses.filter(expense => expense._id !== id);
			displayExpenses(expenses);
			updateTotalAmount();
			updateChart(expenses);
		}

		if (e.target.classList.contains("edit-btn")) {
			const id = e.target.dataset.id;
			const expense = expenses.find(expense => expense._id === id);

			document.getElementById("expense-name").value = expense.name;
			document.getElementById("expense-amount").value = expense.amount;
			document.getElementById("expense-category").value = expense.category;
			document.getElementById("expense-date").value = expense.date;

			editingExpenseId = id;
		}
	});

	filterCategory.addEventListener("change", (e) => {
		const category = e.target.value;
		let filteredExpenses;
		if (category === "All") {
			filteredExpenses = expenses;
		} else {
			filteredExpenses = expenses.filter(expense => expense.category === category);
		}
		displayExpenses(filteredExpenses);
		updateTotalAmount(filteredExpenses);
		updateChart(filteredExpenses);
	});

	function displayExpenses(expenses) {
		expenseList.innerHTML = "";
		expenses.forEach(expense => {
			const row = document.createElement("tr");

			row.innerHTML = `
                <td style="text-align: center;">${expense.name}</td>
                <td style="text-align: center;">₹${expense.amount}</td>
                <td style="text-align: center;">${expense.category}</td>
                <td style="text-align: center;">${expense.date}</td>
                <td style="text-align: center;">
                    <button class="edit-btn" data-id="${expense._id}">Edit</button>
                    <button class="delete-btn" data-id="${expense._id}">Delete</button>
                </td>
            `;

			expenseList.appendChild(row);
		});
	}

	function updateTotalAmount(expensesToConsider = expenses) {
		const total = expensesToConsider.reduce((sum, expense) => sum + expense.amount, 0);
		totalAmount.textContent = total.toFixed(2);
	}

	function updateChart(expenses) {
		const expenseData = expenses.reduce((acc, expense) => {
			const date = expense.date;
			if (!acc[date]) {
				acc[date] = 0;
			}
			acc[date] += expense.amount;
			return acc;
		}, {});

		const labels = Object.keys(expenseData);
		const data = Object.values(expenseData);

		if (window.expenseChart && window.expenseChart.destroy) {
			window.expenseChart.destroy();
		}

		const ctx = document.getElementById('expenseChart').getContext('2d');
		window.expenseChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: 'Total Expenses by Date',
					data: data,
					fill: false,
					borderColor: 'rgba(75, 192, 192, 1)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: 'top',
					},
					tooltip: {
						callbacks: {
							label: function (tooltipItem) {
								return tooltipItem.label + ': ₹' + tooltipItem.raw.toFixed(2);
							}
						}
					}
				},
				scales: {
					x: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Date'
						}
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Amount'
						},
						ticks: {
							callback: function (value) {
								return '₹' + value;
							}
						}
					}
				}
			}
		});
	}
});