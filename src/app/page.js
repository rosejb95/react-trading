'use client'
import { useState, useRef } from 'react';
import { AgGridReact, getSelectedRows } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";


// For all search input fields. Allows us to wait for the user to stop typing.

function TradeSearchPage() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [trades, setTrades] = useState([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  function handleTradeSearch() {
    if (selectedContact == null) {
      alert("Please select a contact before searching for trades.");
      return;
    }

    let search_endpoint = `http://localhost:5000/search/trade?contact_id=${selectedContact.id}`;
    setIsLoadingTrades(true);

    function fetchTrades() {
      (fetch(search_endpoint)
        .then((response) => response.json())
        .then((trades) => {
          setTrades(trades);
          setIsLoadingTrades(false)
        })
      )
    }

    fetchTrades();
  }

  let contactsOnFilter = selectedContact == null ? [] : [selectedContact]


  return (

    <div className='d-flex flex-row flex-grow-1'>
      <div className='d-flex flex-column col-md-3 col-lg-2 sidebar collapse shadow-sm bg-light'>
        <div className='p-2 '>
          {selectedContact && <ContactListGroup contacts={contactsOnFilter} headerText={"Filters applied:"} handleSelection={() => setSelectedContact(null)} />}
        </div>
        <div className='p-2'>
          {isLoadingTrades ? <LoadingButton /> : <button className='btn btn-primary w-100' tabIndex="1" onClick={handleTradeSearch}><strong>Find trades</strong></button>}
        </div>
        <ContactTextSearch contactSelectionHandler={(contact) => setSelectedContact(contact)} />
      </div>
      <div className="d-flex col-md-9 col-lg-10 border">
        <TradeGrid trades={trades} />
      </div>
    </div>
  );
}

function ContactTextSearch({ contactSelectionHandler }) {

  const [contacts, setContacts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const timeoutRef = useRef(0)

  function escapeSearch(e) {
    if (e.key == 'Escape') {
      setSearchText('');
      setContacts([]);
    }
  }

  function handleSearchTextChange(e) {
    setSearchText(e.target.value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetch(`http://localhost:5000/search/contact?search_input=${e.target.value}`)
      .then((response) => response.json())
      .then((contacts) => setContacts(contacts)), 250);
  }

  function applyContactSelectionHandler(e) {
    let anchorElement = e.target.closest('.list-group-item');
    let selectedContactId = anchorElement.getAttribute("data-id");

    let selectedContact = contacts.filter((contact) => contact.id === selectedContactId).at(0);

    contactSelectionHandler(selectedContact);
    setSearchText('');
    setContacts([]);
  }

  return (
    <div className='flex-grow-1 border-bottom p-2'>
      <div>
        <span className='fs-5 fw-semibold'>Contact search</span>
      </div>
      <input value={searchText} type="text" className="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" autoComplete='off' spellCheck="false" style={{ position: "relative", verticalAlign: "top" }} tabIndex="1" placeholder='Search for contacts' onChange={handleSearchTextChange} onKeyDown={escapeSearch} />
      <ContactListGroup contacts={contacts} handleSelection={applyContactSelectionHandler} />
    </div>
  )
}


function LoadingButton({ waitText }) {
  waitText = (waitText == null ? "Loading..." : waitText);

  return (
    <button class="btn btn-primary w-100 p-2" type="button" disabled>
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      {waitText}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div class="d-flex justify-content-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

function TradeGrid({ trades }) {

  if (trades.length == 0) {  // TODO: replace with API endpoint with trade JSON definition.
    return (
      <div className='p-3 bg-body rounded'>
        <span>
          Use the trade search component to find trades.
        </span>
      </div>
    )
  };


  function isFirstColumn(params) {
    let displayedColumns = params.columnApi.getAllDisplayedColumns();
    let isFirstColumnInd = displayedColumns[0] === params.column;

    return isFirstColumnInd
  };


  const tradeColumnDefs = Object.entries(trades.at(0)).map((keyVal) => ({ field: keyVal.at(0) }));

  const gridOptions = {
    columnDefs: tradeColumnDefs,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      headerCheckboxSelection: isFirstColumn,
      checkboxSelection: isFirstColumn,
    },
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
  };

  const gridRef = useRef();

  const tradeGrid = <AgGridReact rowData={trades} gridOptions={gridOptions} ref={gridRef} />

  function submitTradeChanges() {
    fetch(`http://localhost:5000/bulk/trade`, {
      method: "POST",
      body: JSON.stringify(gridRef.current.api.getSelectedRows()),
      mode: "no-cors"
    })
  }



  const [selectedContact, setSelectedContact] = useState(null);

  return ( // Looks like I need to use a bootstrap Modal to fix this. Will work on it later.
    <div>
      <div className="modal" id='exampleModal' tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Modal title</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {selectedContact && <ContactListGroup contacts={contactsOnFilter} headerText={"Filters applied:"} handleSelection={() => setSelectedContact(null)} />}
              <ContactTextSearch contactSelectionHandler={(contact) => setSelectedContact(contact)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary">Save changes</button>
            </div>
          </div>
        </div>
      </div>
      <button className='btn btn-primary w-100' data-bs-toggle="modal" data-bs-target="#exampleModal" tabIndex="1"><strong>Edit Selected Trades</strong></button>
    </div>
  )

  return (
    <div className='d-flex flex-column flex-grow-1 bg-grey'>
      <div className="ag-theme-alpine bg-body flex-grow-1 w-100 p-2" >
        {tradeGrid}
      </div>
      <div className='p-2'>
        <tradeGridEditModal />
        <button className='btn btn-primary w-100' data-bs-toggle="modal" data-bs-target="#exampleModal" tabIndex="1" onClick={submitTradeChanges}><strong>Edit Selected Trades</strong></button>
      </div>
    </div>
  );
}


function ContactListGroup({ contacts, headerText, listGroupClasses, handleSelection }) {
  const listGroupItems = contacts.map((contact) => <ContactListGroupItem contact={contact} handleSelection={handleSelection} />);

  let headerSection = (
    <div className="p-2 boder bottom">
      <span className='fs-5 fw-semibold'>{headerText}</span>
    </div>
  )

  let listGroupClassName = `list-group list-group-flush scrollarea ${listGroupClasses}`
  return (
    <div className={listGroupClassName}>
      {headerText && headerSection}
      {listGroupItems}
    </div>
  )
}

function ContactListGroupItem({ contact, handleSelection }) {
  return (
    <a href="#"
      key={contact.id}
      data-id={contact.id}
      className="list-group-item list-group-item-action py-3 lh-tight border z-100"
      tabIndex="1"
      onClick={handleSelection}
    >
      <div className="d-flex w-100 justify-content-between">
        <h5 className="mb-1">{contact.first_name} {contact.last_name}</h5>
        <small className="text-muted">3 days ago</small>
      </div>
      <h6>{contact.company}</h6>
      <p><b>Mobile Phone:</b> {contact.mobile_phone}<br />
        <b>Email:</b> {contact.email}
      </p>
    </a>
  );
}

export default function Home() {
  return (
    <TradeSearchPage />
  )
}