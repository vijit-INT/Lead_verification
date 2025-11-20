export default function Header() {
  return (
    <header className="app-header d-flex align-items-center p-2 fixed-top bg-white border-bottom">
      <div className="d-flex align-items-center">
        <button className="btn btn-icon d-lg-none" id="sidebar-toggle">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="logo-text ms-2 me-4">CloneMail</span>
      </div>

      <div className="search-box-container me-auto">
        <div className="input-group search-box shadow-sm">
          <span className="input-group-text border-0 bg-transparent ps-3">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input type="text" className="form-control border-0" placeholder="Search mail" />
        </div>
      </div>

      <div className="d-flex align-items-center ms-4">
        <button className="btn btn-icon d-none d-sm-block">
          <span className="material-symbols-outlined">help</span>
        </button>
        <button className="btn btn-icon d-none d-sm-block">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
