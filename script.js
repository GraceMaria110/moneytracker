
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCw3oH-rHujKF16RcIT-LsrvOlWZ3BxJpw",
  authDomain: "financetracker-e97ca.firebaseapp.com",
  projectId: "financetracker-e97ca",
  storageBucket: "financetracker-e97ca.appspot.com",
  messagingSenderId: "307106663973",
  appId: "1:307106663973:web:8e3c6e35b4f487347839cc",
  measurementId: "G-B559JS8JHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
let editIndex = null;


let transactions = [];
let chosenType = null;
let streamList = ['Cash', 'UPI'];
let expenseChart, incomeExpenseChart, savingsChart;

const options = {
  income: { salary: ['Consyst', 'Soca'], others: [] },
  expense: { needs: ['Grocery', 'Rent', 'Electricity'], wants: ['Dineout', 'Drinks'], savings: ['FD', 'Stocks'], others: [] }
};

// ===== Helper: Make canvas sharp =====
function makeCanvasSharp(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  return ctx;
}

async function loadTransactionsFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    transactions = []; // reset local array
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id; // store document ID for deletion/editing
      transactions.push(data);
    });
    renderTransactions();
    calculateTotals();
    updateCharts();
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
}

// ===== DOM Elements =====
window.addEventListener('DOMContentLoaded', async () => {
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
await loadTransactionsFromFirestore();

  // Sidebar tabs
  historyTab.addEventListener('click', () => {
    historyTab.classList.add('active');
    insightsTab.classList.remove('active');
    historySection.style.display='block';
    chartsSection.style.display='none';
  });
  insightsTab.addEventListener('click', () => {
    insightsTab.classList.add('active');
    historyTab.classList.remove('active');
    historySection.style.display='none';
    chartsSection.style.display='flex';
    updateCharts();
  });

  // Add button
  addBtn.addEventListener('click', () => { choicePopup.style.display = 'block'; });
  document.addEventListener('click', (e) => { 
    if (!choicePopup.contains(e.target) && e.target !== addBtn) choicePopup.style.display='none';
  });

  chooseIncome.addEventListener('click', () => startAddFlow('income'));
  chooseExpense.addEventListener('click', () => startAddFlow('expense'));
  cancelBar.addEventListener('click', () => { addBar.style.display='none'; clearAddBar(); chosenType=null; });

  function startAddFlow(type){
    chosenType=type; choicePopup.style.display='none'; addBar.style.display='flex'; dateInput.valueAsDate = new Date();
    populateCategories(); populateSubcategories(); populateStreams();
  }

  // Populate functions
  function populateCategories(){
    categorySelect.innerHTML='';
    const placeholder=document.createElement('option');
    placeholder.value=''; placeholder.textContent='Category'; placeholder.disabled=true; placeholder.selected=true; categorySelect.appendChild(placeholder);
    Object.keys(options[chosenType]||{}).forEach(cat => {
      if(cat!=='others'){
        const opt=document.createElement('option'); opt.value=cat; opt.textContent=cat.charAt(0).toUpperCase()+cat.slice(1);
        categorySelect.appendChild(opt);
      }
    });
    const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; categorySelect.appendChild(otherOpt);
  }
  function populateSubcategories(){
    const selectedCategory=categorySelect.value; subcategorySelect.innerHTML='';
    const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Subcategory'; placeholder.disabled=true; placeholder.selected=true; subcategorySelect.appendChild(placeholder);
    if(selectedCategory && options[chosenType][selectedCategory]) options[chosenType][selectedCategory].forEach(sub => {
      const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub.charAt(0).toUpperCase()+sub.slice(1); subcategorySelect.appendChild(opt);
    });
    const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; subcategorySelect.appendChild(otherOpt);
  }
  categorySelect.addEventListener('change', () => { populateSubcategories(); customCategory.style.display = categorySelect.value==='Others'?'inline-block':'none'; customSubcategory.style.display='none'; });
  subcategorySelect.addEventListener('change', () => { customSubcategory.style.display = subcategorySelect.value==='Others'?'inline-block':'none'; });

  function populateStreams(){ streamSelect.innerHTML=''; 
    const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Stream'; placeholder.disabled=true; placeholder.selected=true; streamSelect.appendChild(placeholder);
    streamList.forEach(s => { const opt=document.createElement('option'); opt.value=s; opt.textContent=s; streamSelect.appendChild(opt); });
    const otherOpt=document.createElement('option'); otherOpt.value='Others'; otherOpt.textContent='Others'; streamSelect.appendChild(otherOpt);
  }
  streamSelect.addEventListener('change', ()=>{ customStream.style.display = streamSelect.value==='Others'?'inline-block':'none'; });

  // Save transaction
saveTransaction.addEventListener('click', async () => {
  let category = categorySelect.value === 'Others' ? customCategory.value.trim() : categorySelect.value || null;
  if (category && !options[chosenType][category]) options[chosenType][category] = [];

  let subcategory = subcategorySelect.value === 'Others' ? customSubcategory.value.trim() : subcategorySelect.value || null;
  if (category && subcategory && !options[chosenType][category].includes(subcategory)) options[chosenType][category].push(subcategory);

  let stream = streamSelect.value === 'Others' ? customStream.value.trim() : streamSelect.value || null;
  if (stream && !streamList.includes(stream)) streamList.push(stream);

  const date = dateInput.value;
  const description = descriptionInput.value;
  const amount = parseFloat(amountInput.value);

  if (!chosenType || !amount) {
    alert('Type and Amount required');
    return;
  }

  const transaction = { type: chosenType, category, subcategory, stream, date, description, amount };

  try {
    if (editIndex !== null) {
      // ✏️ Update existing Firestore document
      const existing = transactions[editIndex];
      if (existing.id) {
        await setDoc(doc(db, 'transactions', existing.id), transaction);
        transaction.id = existing.id; // keep same ID
      }
      transactions[editIndex] = transaction;
      editIndex = null;
      console.log('Transaction updated!');
    } else {
      // ➕ Add new transaction
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      transaction.id = docRef.id;
      transactions.push(transaction);
      console.log('Transaction saved!');
    }

    renderTransactions();
    calculateTotals();
    updateCharts();
    addBar.style.display = 'none';
    clearAddBar();
    chosenType = null;
  } catch (err) {
    console.error('Error saving to Firestore:', err);
  }
});


  function clearAddBar(){
    categorySelect.value=''; subcategorySelect.value=''; streamSelect.value='';
    customCategory.value=''; customSubcategory.value=''; customStream.value='';
    dateInput.value=''; amountInput.value=''; descriptionInput.value='';
    customCategory.style.display='none'; customSubcategory.style.display='none'; customStream.style.display='none';
  }

  // Render table
  function renderTransactions(){
    transactionsTable.innerHTML='';
    transactions.forEach((t,i)=>{
      const row=document.createElement('tr');
      row.innerHTML=`
        <td>${t.date}</td>
        <td>${t.category||'---'}</td>
        <td>${t.subcategory||'---'}</td>
        <td>${t.stream||'---'}</td>
        <td>${t.description||'---'}</td>
        <td>₹${t.amount}</td>
        <td>
          <button onclick="editTransaction(${i})">✏️</button>
          <button onclick="deleteTransaction(${i})">🗑️</button>
        </td>`;
      transactionsTable.appendChild(row);
    });
  }

 window.deleteTransaction = async function(i){
  const t = transactions[i];
  if (t.id) { // Only delete from Firestore if it has an ID
    await deleteDoc(doc(db, "transactions", t.id));
  }
  transactions.splice(i,1);
  renderTransactions(); 
  calculateTotals(); 
  updateCharts();
}

 window.editTransaction = function(i){
  const t = transactions[i]; 
  chosenType = t.type; 
  addBar.style.display = 'flex';
  categorySelect.value = t.category; 
  subcategorySelect.value = t.subcategory; 
  streamSelect.value = t.stream;
  dateInput.value = t.date; 
  amountInput.value = t.amount; 
  descriptionInput.value = t.description;
  populateSubcategories(); 

  // Keep the ID for Firestore update when saving edited transaction
  editIndex = i; // add a global variable: let editIndex = null;
}


  function calculateTotals(){
    let total=0,cash=0,upi=0;
    transactions.forEach(t=>{
      const val=t.type==='income'?t.amount:-t.amount;
      total+=val; if(t.stream==='Cash') cash+=val; if(t.stream==='UPI') upi+=val;
    });
    grandTotalEl.textContent=`Total: ₹${total}`;
    cashTotalEl.textContent=`₹${cash}`;
    upiTotalEl.textContent=`₹${upi}`;
  }

  // Charts
  window.updateCharts = function(){
    let needs=0, wants=0, savings=0, inc=0, exp=0, savingsBreakdown={};
    transactions.forEach(t=>{
      const amt=Number(t.amount)||0;
      if(t.type==='expense'){
        if(t.category==='needs') needs+=amt;
        else if(t.category==='wants') wants+=amt;
        else if(t.category==='savings'){ savings+=amt; savingsBreakdown[t.subcategory]=(savingsBreakdown[t.subcategory]||0)+amt; }
        exp+=amt;
      } else { inc+=amt; }
    });

    // Expense chart
    const ctx1=makeCanvasSharp(document.getElementById('expenseChart'));
    if(expenseChart) expenseChart.destroy();
    expenseChart=new Chart(ctx1,{ type:'pie', data:{ labels:['Needs','Wants','Savings'], datasets:[{ data:[needs,wants,savings], backgroundColor:['#f18934','#c22f0a','#1fc062'] }] } });

    // Income vs Expense chart
    const ctx2=makeCanvasSharp(document.getElementById('incomeExpenseChart'));
    if(incomeExpenseChart) incomeExpenseChart.destroy();
    incomeExpenseChart=new Chart(ctx2,{ type:'bar', data:{ labels:['Income','Expense'], datasets:[{ data:[inc||0,exp||0], backgroundColor:['#1fc062','#c22f0a'] }] } });

    // Savings breakdown
    const ctx3=makeCanvasSharp(document.getElementById('savingsChart'));
    if(savingsChart) savingsChart.destroy();
    savingsChart=new Chart(ctx3,{ type:'pie', data:{ labels:Object.keys(savingsBreakdown), datasets:[{ data:Object.values(savingsBreakdown), backgroundColor:['#2e85cc','#00ffbf','#fffb00','#e169ff','#ae00ff'] }] } });
  }
});
