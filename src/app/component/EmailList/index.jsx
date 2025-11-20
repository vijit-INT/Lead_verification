"use client";
import React from "react";
import styles from "./EmailList.module.scss";

const emails = [
  {
    id: 1,
    sender: "John Doe",
    subject: "Meeting Reminder",
    message: "Hi, don't forget our meeting tomorrow at 10AM.",
    time: "10:15 AM",
  },
  {
    id: 2,
    sender: "Google",
    subject: "Security Alert",
    message: "New login detected from Chrome Windows.",
    time: "9:00 AM",
  },
  {
    id: 3,
    sender: "Amazon",
    subject: "Your order has shipped",
    message: "Your package will be delivered soon.",
    time: "Yesterday",
  },
];

export default function EmailList() {
  return (
    <div className={styles.emailListContainer}>
      {emails.map((email) => (
        <div key={email.id} className={styles.emailCard}>
          <div className={styles.left}>
            <h5 className={styles.sender}>{email.sender}</h5>
            <p className={styles.subject}>{email.subject}</p>
            <p className={styles.message}>{email.message}</p>
          </div>
          <div className={styles.right}>
            <span className={styles.time}>{email.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
