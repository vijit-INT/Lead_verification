import EmailList from "../component/EmailList";
import Header from "../component/Header";
import Sidebar from "../component/Sidebar";

export default function Inbox() {
  return (
    <div className="layoutWrapper">
      {/* <Sidebar /> */}
      <div className="contentArea">
        {/* <Header /> */}
        <EmailList />
      </div>
    </div>
  );
}
