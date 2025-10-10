// ===== Data =====
let transactions = [];
let chosenType = null;
let streamList = ['Cash', 'UPI'];

// ===== DOM Elements =====
const addBtn = document.getElementById('addBtn');
const choicePopup = document.getElementById('choicePopup');
const addBar = document.getElementById('addBar');
const chooseIncome = document.getElementById('chooseIncome');
const chooseExpense = document.getElementById('chooseExpense');
const cancelBar = document.getElementById('cancelBar');
const saveTransaction = document.getElementById('saveTransaction');

const categorySelect = document.getElementById('category');
const subcategorySelect = document.getElementById('subcategory');
const streamSelect = document.getElementById('stream');
const customCategory = document.getElementById('customCategory');
const customSubcategory = document.getElementById('customSubcategory');
const customStream = document.getElementById('customStream');
const dateInput = document.getElementById('date');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');

const transactionsTable = document.querySelector('#transactionsTable tbody');
const grandTotalEl = document.getElementById('grandTotal');
const cashTotalEl = document.getElementById('cashTotal');
const upiTotalEl = document.getElementById('upiTotal');

const historyTab = document.getElementById('historyTab');
const insightsTab = document.getElementById('insightsTab');
const historySection = document.getElementById('historySection');
const chartsSection = document.getElementById('chartsSection');

let expenseChart, incomeExpenseChart, savingsChart;

const options = {
  income: { salary: ['Consyst', 'Soca'], others: [] },
  expense: { needs: ['Grocery', 'Rent', 'Electricity'], wants: ['Dineout', 'Drinks'], savings: ['FD', 'Stocks'], others: [] }
};

// ===== Sidebar Tabs =====
historyTab.addEventListener('click', () => { historyTab.classList.add('active'); insightsTab.classList.remove('active'); historySection.style.display='block'; chartsSection.style.display='none'; });
insightsTab.addEventListener('click', () => { insightsTab.classList.add('active'); historyTab.classList.remove('active'); historySection.style.display='none'; chartsSection.style.display='flex'; updateCharts(); });

// ===== Add Button =====
addBtn.addEventListener('click', () => { choicePopup.style.display = 'block'; });
document.addEventListener('click', (e) => { if (!choicePopup.contains(e.target) && e.target !== addBtn) choicePopup.style.display = 'none'; });

// ===== Add Flow =====
chooseIncome.addEventListener('click', () => startAddFlow('income'));
chooseExpense.addEventListener('click', () => startAddFlow('expense'));
cancelBar.addEventListener('click', () => { addBar.style.display='none'; clearAddBar(); chosenType=null; });

function startAddFlow(type){
  chosenType=type; choicePopup.style.display='none'; addBar.style.display='flex'; dateInput.valueAsDate = new Date();
  populateCategories(); populateSubcategories(); populateStreams();
}

// ===== Populate =====
function populateCategories(){
  categorySelect.innerHTML=''; const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Category'; placeholder.disabled=true; placeholder.selected=true; categorySelect.appendChild(placeholder);
  Object.keys(options[chosenType]||{}).forEach(cat => { if(cat!=='others'){ const opt=document.createElement('option'); opt.value=cat; opt.textContent=cat.charAt(0).toUpperCase()+cat.slice(1); categorySelect.appendChild(opt); } });
  const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; categorySelect.appendChild(otherOpt);
}
function populateSubcategories(){
  const selectedCategory=categorySelect.value; subcategorySelect.innerHTML='';
  const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Subcategory'; placeholder.disabled=true; placeholder.selected=true; subcategorySelect.appendChild(placeholder);
  if(selectedCategory && options[chosenType][selectedCategory]) options[chosenType][selectedCategory].forEach(sub => { const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub.charAt(0).toUpperCase()+sub.slice(1); subcategorySelect.appendChild(opt); });
  const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; subcategorySelect.appendChild(otherOpt);
}
categorySelect.addEventListener('change', () => { populateSubcategories(); customCategory.style.display = categorySelect.value==='Others'?'inline-block':'none'; customSubcategory.style.display='none'; });
subcategorySelect.addEventListener('change', () => { customSubcategory.style.display = subcategorySelect.value==='Others'?'inline-block':'none'; });

// ===== Streams =====
function populateStreams(){ streamSelect.innerHTML=''; const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Stream'; placeholder.disabled=true; placeholder.selected=true; streamSelect.appendChild(placeholder);
streamList.forEach(s => { const opt=document.createElement('option'); opt.value=s; opt.textContent=s; streamSelect.appendChild(opt); });
const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; streamSelect.appendChild(otherOpt); }
streamSelect.addEventListener('change', ()=>{ customStream.style.display = streamSelect.value==='Others'?'inline-block':'none'; });

// ===== Save Transaction =====
saveTransaction.addEventListener('click',()=>{
  let category=categorySelect.value==='Others'?customCategory.value.trim():categorySelect.value||null;
  if(category && !options[chosenType][category]) options[chosenType][category]=[];
  let subcategory=subcategorySelect.value==='Others'?customSubcategory.value.trim():subcategorySelect.value||null;
  if(category && subcategory && !options[chosenType][category].includes(subcategory)) options[chosenType][category].push(subcategory);
  let stream=streamSelect.value==='Others'?customStream.value.trim():streamSelect.value||null;
  if(stream && !streamList.includes(stream)) streamList.push(stream);
  const date=dateInput.value, description=descriptionInput.value, amount=parseFloat(amountInput.value);
  if(!chosenType || !amount) return alert('Type and Amount required');
  transactions.push({type:chosenType,category,subcategory,stream,date,description,amount});
  renderTransactions(); calculateTotals(); updateCharts();
  addBar.style.display='none'; clearAddBar(); chosenType=null;
});

// ===== Clear =====
function clearAddBar(){
  categorySelect.value=''; subcategorySelect.value=''; streamSelect.value=''; customCategory.value=''; customSubcategory.value=''; customStream.value=''; dateInput.value=''; amountInput.value=''; descriptionInput.value='';
  customCategory.style.display='none'; customSubcategory.style.display='none'; customStream.style.display='none';
}

// ===== Render Transactions =====
function renderTransactions() {
  transactionsTable.innerHTML = '';
  transactions.forEach((t, i) => {
    const row = document.createElement('tr');
    
      // Set row background based on type
    if (t.type === 'income') row.classList.add('row-income');
    else if (t.type === 'expense') row.classList.add('row-expense');

    // Determine stream class for the <td>
    let streamClass = '';
    if (t.stream === 'UPI') streamClass = 'stream-upi';
    else if (t.stream === 'Cash') streamClass = 'stream-cash';

    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.category || '---'}</td>
      <td>${t.subcategory || '---'}</td>
      <td class="${streamClass}">${t.stream || '---'}</td>
      <td>${t.description || '---'}</td>
      <td>₹${t.amount}</td>
      <td>
        <button onclick="editTransaction(${i})">✏️</button>
        <button onclick="deleteTransaction(${i})">🗑️</button>
      </td>
    `;
    transactionsTable.appendChild(row);
  });
}


// ===== Edit/Delete =====
function deleteTransaction(i){ transactions.splice(i,1); renderTransactions(); calculateTotals(); updateCharts(); }
function editTransaction(i){
  const t=transactions[i]; chosenType=t.type; addBar.style.display='flex';
  categorySelect.value=t.category; subcategorySelect.value=t.subcategory; streamSelect.value=t.stream; dateInput.value=t.date; amountInput.value=t.amount; descriptionInput.value=t.description;
  populateSubcategories(); transactions.splice(i,1); renderTransactions();
}

// ===== Totals =====
function calculateTotals(){
  let total=0,cash=0,upi=0;
  transactions.forEach(t=>{
    const val=t.type==='income'?t.amount:-t.amount;
    total+=val; if(t.stream==='Cash') cash+=val; if(t.stream==='UPI') upi+=val;
  });
  grandTotalEl.textContent=`Total: ₹${total}`; cashTotalEl.textContent=`₹${cash}`; upiTotalEl.textContent=`₹${upi}`;
}

// ===== Charts =====

// ===== Helper: Make canvas sharp for high-DPI screens =====
function makeCanvasSharp(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  return ctx;
}

function updateCharts() {
  let needs = 0, wants = 0, savings = 0, inc = 0, exp = 0;
  let savingsBreakdown = {};

  // Sum up transactions
  transactions.forEach(t => {
    const amt = Number(t.amount) || 0; // ensure numeric
    if (t.type === 'expense') {
      if (t.category === 'needs') needs += amt;
      else if (t.category === 'wants') wants += amt;
      else if (t.category === 'savings') {
        savings += amt;
        savingsBreakdown[t.subcategory] = (savingsBreakdown[t.subcategory] || 0) + amt;
      }
      exp += amt;
    } else {
      inc += amt;
    }
  });

  // Expense Pie (legend kept)
  const ctx1 = makeCanvasSharp(document.getElementById('expenseChart'));

  
  if (expenseChart) expenseChart.destroy();
  expenseChart = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Needs', 'Wants', 'Savings'],
      datasets: [{
        data: [needs, wants, savings],
        backgroundColor: ['#f18934ff', '#c22f0aff', '#1fc062ff']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }, // keep legend
        tooltip: {
          callbacks: {
            label: function(c) {
              const d = c.dataset;
              const total = d.data.reduce((s, v) => s + v, 0);
              const value = d.data[c.dataIndex];
              const pct = ((value / total) * 100).toFixed(1);
              return `${c.label}: ₹${value} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // Income vs Expense Bar (legend removed)
  const ctx2 = makeCanvasSharp(document.getElementById('incomeExpenseChart'));
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  incomeExpenseChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [inc || 0, exp || 0],
        backgroundColor: ['#1fc062ff', '#c22f0aff']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }, // ✅ hide legend for this chart
        tooltip: {
          callbacks: { label: c => `${c.label}: ₹${c.formattedValue}` }
        }
      }
    }
  });

  // Savings Breakdown Pie (legend kept)
  const ctx3 = makeCanvasSharp(document.getElementById('savingsChart'));
  if (savingsChart) savingsChart.destroy();
  savingsChart = new Chart(ctx3, {
    type: 'pie',
    data: {
      labels: Object.keys(savingsBreakdown),
      datasets: [{
        data: Object.values(savingsBreakdown),
        backgroundColor: ['#2e85ccff', '#00ffbfff', '#fffb00ff', '#e169ffff', '#ae00ffff']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }, // keep legend
        tooltip: {
          callbacks: {
            label: c => {
              const d = c.dataset;
              const total = d.data.reduce((s, v) => s + v, 0);
              const value = d.data[c.dataIndex];
              const pct = ((value / total) * 100).toFixed(1);
              return `${c.label}: ₹${value} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}