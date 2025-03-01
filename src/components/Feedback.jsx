import { useState, useEffect } from "react";
import "../index.css";

const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alice Johnson" },
];

const initialMessages = {
  1: [
    { sender: "admin", text: "Hello John! How can I help you?" },
    { sender: "John Doe", text: "Hi, I need some information." },
  ],
  2: [
    { sender: "admin", text: "Hi Jane! What's up?" },
    { sender: "Jane Smith", text: "Just checking in!" },
  ],
  3: [
    { sender: "admin", text: "Alice, how's your day?" },
    { sender: "Alice Johnson", text: "Going great, thanks!" },
  ],
};

export default function Feedback() {
  const [selectedUser, setSelectedUser] = useState(users[0].id);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSendMessage = () => {
    if (input.trim() !== "") {
      setMessages({
        ...messages,
        [selectedUser]: [
          ...messages[selectedUser],
          { sender: "admin", text: input },
        ],
      });
      setInput("");
    }
  };

  return (
    <div className="flex h-screen bg-[#F5EFE6]">
      {/* Sidebar */}
      <div className="w-1/4 bg-[#F5EFE6] p-4 border-r text-[#1A4D2E]">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        {users.map((user) => (
          <div
            key={user.id}
            className={`p-2 cursor-pointer rounded-lg ${
              selectedUser === user.id
                ? "bg-[#1A4D2E] text-white"
                : "bg-white text-[#1A4D2E]"
            }`}
            onClick={() => setSelectedUser(user.id)}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      {selectedUser !== null && (
        <div className="flex-1 p-6 flex flex-col">
          {/* Back Button for Mobile */}
          {isMobile && (
            <button
              className="mb-4 p-2 bg-[#1A4D2E] text-white rounded-lg"
              onClick={() => setSelectedUser(null)}
            >
              Back
            </button>
          )}
          <h2 className="text-2xl font-bold mb-4 text-[#1A4D2E]">
            Chat with {users.find((user) => user.id === selectedUser).name}
          </h2>
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 overflow-y-auto">
            {messages[selectedUser].map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg max-w-xs ${
                  msg.sender === "admin"
                    ? "bg-[#1A4D2E] text-white self-end"
                    : "bg-[#F5EFE6] text-[#1A4D2E]"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          {/* Input Area */}
          <div className="mt-4 flex">
            <input
              type="text"
              className="flex-1 p-2 border rounded-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              className="ml-2 p-2 bg-[#1A4D2E] text-white rounded-lg"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
