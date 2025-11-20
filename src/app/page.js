import Image from "next/image";
import styles from "./page.module.css";
import Inbox from "./Inbox/inbox";
import NewGamilPage from "./component/NewEmailPage/index,";

export default function Home() {
  return (
    <div className={styles.page}>
       {/* <Inbox /> */}
      <NewGamilPage />
    </div>
  );
}
