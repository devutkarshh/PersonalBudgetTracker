document.addEventListener("DOMContentLoaded", () => {
	const expenseForm = document.getElementById("expense-form");
	const expenseList = document.getElementById("expense-list");
	const totalAmount = document.getElementById("total-amount");
	const filterCategory = document.getElementById("filter-category");

	// Initialize expenses from localStorage or empty array
	let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

	// Display the expenses and total amount on page load
	displayExpenses(expenses);
	updateTotalAmount();
	updateChart(expenses);

	expenseForm.addEventListener("submit", (e) => {
		e.preventDefault();

		const name = document.getElementById("expense-name").value;
		const amount = parseFloat(document.getElementById("expense-amount").value);
		const category = document.getElementById("expense-category").value;
		const date = document.getElementById("expense-date").value;

		const expense = {
			id: Date.now(),
			name,
			amount,
			category,
			date
		};

		expenses.push(expense);
		saveExpensesToLocalStorage(expenses);
		displayExpenses(expenses);
		updateTotalAmount();
		updateChart(expenses);

		expenseForm.reset();
	});

	expenseList.addEventListener("click", (e) => {
		if (e.target.classList.contains("delete-btn")) {
			const id = parseInt(e.target.dataset.id);
			expenses = expenses.filter(expense => expense.id !== id);
			saveExpensesToLocalStorage(expenses);
			displayExpenses(expenses);
			updateTotalAmount();
			updateChart(expenses);
		}

		if (e.target.classList.contains("edit-btn")) {
			const id = parseInt(e.target.dataset.id);
			const expense = expenses.find(expense => expense.id === id);

			document.getElementById("expense-name").value = expense.name;
			document.getElementById("expense-amount").value = expense.amount;
			document.getElementById("expense-category").value = expense.category;
			document.getElementById("expense-date").value = expense.date;

			expenses = expenses.filter(expense => expense.id !== id);
			saveExpensesToLocalStorage(expenses);
			displayExpenses(expenses);
			updateTotalAmount();
			updateChart(expenses);
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
                <td style="text-align: center;">₹${expense.amount.toFixed(2)}</td>
                <td style="text-align: center;">${expense.category}</td>
                <td style="text-align: center;">${expense.date}</td>
                <td style="text-align: center;">
                    <button class="edit-btn" data-id="${expense.id}">Edit</button>
                    <button class="delete-btn" data-id="${expense.id}">Delete</button>
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
		// Aggregate expenses by date
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

		// Destroy the previous chart instance if it exists
		if (window.expenseChart && window.expenseChart.destroy) {
			window.expenseChart.destroy();
		}

		// Create a new chart
		const ctx = document.getElementById('expenseChart').getContext('2d');
		window.expenseChart = new Chart(ctx, {
			type: 'line', // Use line chart for dates
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

	function saveExpensesToLocalStorage(expenses) {
		localStorage.setItem('expenses', JSON.stringify(expenses));
	}

	const logoutBtn = document.getElementById('logoutBtn');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', function () {
			localStorage.removeItem('loggedInUser'); // Remove the logged in user
			window.location.href = 'login.html'; // Redirect to login page after logout
		});
	}
});
