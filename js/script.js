/**
 * script.js - Logika Klien untuk Aplikasi Riwayat Transaksi
 */

(() => {
  'use strict';

  // ==========================
  // 1. SELEKSI ELEMEN DOM
  // ==========================
  const elements = {
    transactionCards: document.querySelectorAll('.transaction-card'),
    statusButtons: document.querySelectorAll('.status-btn'),
    dateFilter: document.getElementById('dateFilter'),
    customDateContainer: document.getElementById('customDateContainer'),
    startDateInput: document.getElementById('startDate'),
    endDateInput: document.getElementById('endDate'),
    applyDateFilterBtn: document.getElementById('applyDateFilterBtn'),
    searchInput: document.getElementById('searchInput'),
    modal: document.getElementById('transactionModal'),
    modalCloseBtn: document.querySelector('.modal-close'),
    modalHeader: document.querySelector('.modal-header'),
    modalHeaderTitle: document.getElementById('modal-header-title'),
    modalHeaderStatus: document.getElementById('modal-header-status'),
    modalDetails: {
      trxid: document.getElementById('modal-trxid'),
      tgl: document.getElementById('modal-tgl'),
      kode: document.getElementById('modal-kode'),
      nama: document.getElementById('modal-nama'),
      tujuan: document.getElementById('modal-tujuan'),
      harga: document.getElementById('modal-harga'),
      sn: document.getElementById('modal-sn'),
      reffid: document.getElementById('modal-reffid'),
    }
  };

  // ==========================
  // 2. STATE APLIKASI
  // ==========================
  const state = {
    activeStatusFilter: 'all',
  };

  // ==========================
  // 3. FUNGSI UTILITAS
  // ==========================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  /**
   * Mem-parsing string tanggal dengan format dd/mm/yyyy menjadi objek Date.
   * @param {string} dateString - String tanggal dalam format dd/mm/yyyy
   * @returns {Date|null} Objek Date jika valid, atau null jika tidak valid.
   */
  const parseDateDMY = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Bulan dalam JavaScript adalah 0-11
    const year = parseInt(parts[2], 10);

    // Validasi sederhana
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    // Membuat objek Date. Bulan dikurangi 1 karena indeks bulan JavaScript dimulai dari 0.
    const date = new Date(year, month - 1, day);

    // Memastikan tanggal yang dibuat valid (misalnya, 31/02/2025 akan menjadi 3/03/2025)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }

    return date;
  };

  // ==========================
  // 4. LOGIKA APLIKASI INTI
  // ==========================
  const applyAllFilters = () => {
    const { dateFilter, startDateInput, endDateInput, searchInput } = elements;
    const { activeStatusFilter } = state;

    const dateFilterValue = dateFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilterValue) {
      case 'today':
        startDate = today;
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date();
        break;
      case 'custom':
        // Gunakan fungsi parseDateDMY untuk format dd/mm/yyyy
        startDate = parseDateDMY(startDateInput.value);
        endDate = parseDateDMY(endDateInput.value);
        
        // Jika parsing gagal, anggap sebagai tidak ada filter
        if (!startDate || !endDate) {
          startDate = endDate = null;
        } else {
          // Set waktu untuk memastikan rentang tanggal mencakup seluruh hari
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate = endDate = null;
    }

    elements.transactionCards.forEach(card => {
      const cardStatus = card.getAttribute('data-status');
      const cardDate = new Date(card.getAttribute('data-date'));

      const statusMatch = activeStatusFilter === 'all' || cardStatus === activeStatusFilter;
      const dateMatch = (!startDate || !endDate) || (cardDate >= startDate && cardDate <= endDate);
      
      let searchMatch = true;
      if (searchTerm) {
        const searchableText = `
          ${card.querySelector('.transaction-id').textContent}
          ${card.querySelector('.transaction-detail').textContent}
          ${card.querySelector('.transaction-status').textContent}
        `.toLowerCase();
        searchMatch = searchableText.includes(searchTerm);
      }

      card.style.display = (statusMatch && dateMatch && searchMatch) ? 'block' : 'none';
    });
  };

  const showModal = (transactionData) => {
    const { modal, modalHeader, modalHeaderTitle, modalHeaderStatus, modalDetails } = elements;
    
    modalDetails.trxid.textContent = transactionData.trxid;
    modalDetails.tgl.textContent = formatDate(transactionData.tgl_masuk);
    modalDetails.kode.textContent = transactionData.kode_produk;
    modalDetails.nama.textContent = transactionData.nama;
    modalDetails.tujuan.textContent = transactionData.tujuan;
    modalDetails.harga.textContent = `Rp ${formatPrice(transactionData.harga)}`;
    modalDetails.sn.textContent = transactionData.sn || '-';
    modalDetails.reffid.textContent = transactionData.reffid;

    const status = transactionData.status.toLowerCase();
    modalHeader.className = 'modal-header';
    modalHeader.classList.add(status);
    
    modalHeaderTitle.textContent = 'Detail Transaksi';
    modalHeaderStatus.textContent = transactionData.status;

    modal.classList.add('show');
  };

  const hideModal = () => {
    const { modal, modalHeader } = elements;
    modalHeader.className = 'modal-header';
    modal.classList.remove('show');
  };

  // ==========================
  // 5. PENGGUNAAN EVENT LISTENER
  // ==========================
  
  const setupEventListeners = () => {
    const { statusButtons, dateFilter, customDateContainer, startDateInput, endDateInput, searchInput, transactionCards, modalCloseBtn, modal, applyDateFilterBtn } = elements;

    statusButtons.forEach(button => {
      button.addEventListener('click', () => {
        const status = button.getAttribute('data-status');
        if (button.classList.contains('active') && status !== 'all') {
          state.activeStatusFilter = 'all';
          statusButtons.forEach(btn => btn.classList.remove('active'));
          document.querySelector('[data-status="all"]').classList.add('active');
        } else {
          statusButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          state.activeStatusFilter = status;
        }
        applyAllFilters();
      });
    });

    dateFilter.addEventListener('change', () => {
      if (dateFilter.value === 'custom') {
        customDateContainer.style.display = 'flex';
        // Kosongkan input saat mode custom dipilih
        startDateInput.value = '';
        endDateInput.value = '';
        toggleApplyButton();
      } else {
        customDateContainer.style.display = 'none';
        applyAllFilters();
      }
    });

    // Event untuk input tanggal kustom (hanya untuk toggle tombol)
    startDateInput.addEventListener('input', toggleApplyButton);
    endDateInput.addEventListener('input', toggleApplyButton);

    applyDateFilterBtn.addEventListener('click', applyAllFilters);

    searchInput.addEventListener('input', applyAllFilters);

    transactionCards.forEach(card => {
      card.addEventListener('click', () => {
        const transactionData = JSON.parse(card.getAttribute('data-transaction'));
        showModal(transactionData);
      });
    });

    modalCloseBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        hideModal();
      }
    });
  };

  /**
   * Fungsi untuk mengaktifkan/menonaktifkan tombol "Cari"
   * berdasarkan apakah kedua tanggal sudah diisi.
   */
  const toggleApplyButton = () => {
    const { startDateInput, endDateInput, applyDateFilterBtn } = elements;
    if (startDateInput.value && endDateInput.value) {
      applyDateFilterBtn.disabled = false;
    } else {
      applyDateFilterBtn.disabled = true;
    }
  };

  // ==========================
  // 6. INISIALISASI APLIKASI
  // ==========================
  const init = () => {
    setupEventListeners();
    applyAllFilters();
  };

  init();

})();