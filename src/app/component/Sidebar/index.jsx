export default function Sidebar() {
  return (
    <nav className="sidebar flex-shrink-0 d-flex flex-column" id="app-sidebar">
      {/* <button className="btn compose-btn w-auto m-3 shadow-sm rounded-pill" id="open-compose">
        <span className="material-symbols-outlined me-2">edit</span> Compose
      </button> */}

      <ul className="nav flex-column sidebar-nav">
        <li className="nav-item">
          <a className="nav-link active folder-link" href="#">
            <span className="material-symbols-outlined me-3">inbox</span>
            Inbox <span className="badge float-end fw-bold">15</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
