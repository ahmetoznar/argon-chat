import React, { useCallback, useEffect, useRef, useState } from "react";
import { withTranslation } from "react-i18next";
import firebase, { db } from "../../firebase";
import axios from "../../axios";
import axiosOther from "axios";
import $ from "jquery";
import Swal from "sweetalert2";
import {
  disconnectWallet,
  connectWallet,
  getWeb3,
  checkProvider,
} from "../../ethereum/web3";
import { getMain } from "../../ethereum/main";
import { getPersonData } from "../../ethereum/getPersonData";
import { MAIL_API_URL, API_URL, EXPRESS_URL, NGROK } from "../../config";
import moment from "moment";
import Skeleton from "react-loading-skeleton";
var localStorage = require("localStorage");
import DotLoader from "react-spinners/DotLoader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../../io/socket.io";
import { useRouter } from "next/router";
import Head from "next/head";
import { css } from '@emotion/react'
const isConnected = Boolean(localStorage.getItem("isConnected"));

let web3;
let main;

function inbox({ t }) {
  const [address, setAddress] = useState("");
  const [accountType, setAccountType] = useState("");
  const [allUsersData, setAllUsersData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [blockChainUsers, setBlockChainUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [blockchainUsersLoading, setBlockchainUsersLoading] = useState(true);
  const [allChats, setAllChats] = useState([]);
  const [allChatsLoading, setAllChatsLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [fakeMessage, setFakeMessage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [fakePathImage, setCurrentFakePathImage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [fast_message, setFastMessage] = useState("");
  const [fastMessageAddress, setFastMessageAddress] = useState("");
  const [sendingFastMessage, setSendingFastMessage] = useState(false);
  const fileInput = useRef(null);
  const [typing, setTyping] = useState(false);
  const messagesScroll = useRef();
  const [allFilesLoading, setAllFilesLoading] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [chatPage, setChatPage] = useState(false);
  const router = useRouter();
  const override = css`
    display: block;
    margin: 0 auto;
    border-color: red;
  `;
  useEffect(() => {
    if (chatPage) {
      $("#chat-page").addClass("main-visible");
    } else {
      $("#chat-page").removeClass("main-visible");
      $("#main-start-page").removeClass("main-visible");
    }
  }, [chatPage]);

  useEffect(() => {
    async function fetchData() {
      $(".nk-chat-profile").hide();
      let allUsersData = [];
      if (isConnected) {
        web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        main = await getMain();

        var getAllUsers = await main.methods.getAllPersons().call();
        const accountType = await getPersonData.personAccountType;
        setAccountType(accountType);
        setAddress(accounts[0]);
        if (getAllUsers) {
          setBlockChainUsers(getAllUsers);
          setBlockchainUsersLoading(false);
        }
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function serviceWorkerLoad() {
      await navigator.serviceWorker.register("serviceWorker.js");
    }
    serviceWorkerLoad();
  }, []);

  const displayNotification = () => {
    if (Notification.permission == "granted") {
      navigator.serviceWorker.getRegistration().then(function (reg) {
        reg.showNotification("Received the message!");
      });
    }
  };

  useEffect(() => {
    localStorage.removeItem("23a41b63z0c853cfj");
  }, []);

  const handleChange = async (event) => {
    await setSearchInput(event.target.value);
    globalSearch();
  };
  const globalSearch = () => {
    let filteredData = blockChainUsers.filter((value) => {
      return value.toLowerCase().includes(searchInput.toLowerCase());
    });
    if (filteredData.length > 0) {
      setAllUsersData(filteredData);
    } else {
      setAllUsersData([]);
    }
  };
  const handleMessage = (val) => {
    setMessage(val);
    if (val) {
      const receiver =
        currentChat.members[0] == address
          ? currentChat.members[1]
          : currentChat.members[0];
      socket.emit("typingClient", {
        receiver: receiver,
        chat_id: currentChat.chat_id,
      });
    } else {
      const receiver =
        currentChat.members[0] == address
          ? currentChat.members[1]
          : currentChat.members[0];
      socket.emit("typingStopClient", {
        receiver: receiver,
        chat_id: currentChat.chat_id,
      });
    }
  };
  const chat = (chatItem) => {
    setChatPage(true);
    async function setChat(item) {
      localStorage.setItem("23a41b63z0c853cfj", item.chat_id);
      setCurrentChat(item);
      setMessagesLoading(true);
    }
    setChat(chatItem).then(async () => {
      const response = await axios.post("chats/messages", {
        chatItem,
        address,
      });
      if (response.data.length > 0) {
        setAllMessages(response.data);
        setMessagesLoading(false);
        messagesScroll.current.scrollIntoView({ smooth: true });
      } else {
        setAllMessages([]);
        setMessagesLoading(false);
        messagesScroll.current.scrollIntoView({ smooth: true });
      }
    });
  };
  const makeId = (length) => {
    var result = [];
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result.push(
        characters.charAt(Math.floor(Math.random() * charactersLength))
      );
    }
    return result.join("");
  };

  const sendFile = async (file) => {
    var receiver =
      currentChat.members[0] == address
        ? currentChat.members[1]
        : currentChat.members[0];
    var messageModel = {
      date: Date.now(),
      file: {
        file_address: fakePathImage,
      },
      message_id: allMessages.length + 1,
      receiver: receiver,
      sender: address,
    };

    fakeMessageSet(messageModel).then(() => {
      messagesScroll.current.scrollIntoView({ behavior: "smooth" });
    });

    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosOther.post(
      "https://argonfiles.online/upload.php/",
      formData
    );

    if (res.data.file) {
      const payload = {
        filename: res.data.file,
        myCurrentChat: currentChat,
        myMessageModel: messageModel,
      };

      const response = await axios.post(
        `${EXPRESS_URL}chats/messages/add/file`,
        payload
      );
      if (response.data.err) {
        fakeMessageSet(null);
        setCurrentFakePathImage("");
        setCurrentImage(null);
        toast(response.data.err, {
          type: "error",
        });
      } else {
        socket.emit("sendMessage", {
          message: response.data.message,
          currentChat: response.data.newCurrentChat,
        });
        setAllMessages((allMessages) => [
          ...allMessages,
          response.data.message,
        ]);
        setSendingMessage(false);
        setMessage("");
        setFakeMessage(null);
        setCurrentImage(null);
        setCurrentFakePathImage("");
        fileInput.current.value = "";
        messagesScroll.current.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      toast(res.data.err, {
        type: "error",
      });
    }
  };

  const fakeMessageSet = async (messageModel) => {
    setFakeMessage(messageModel);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message) {
      setSendingMessage(true);

      const payload = {
        date: Date.now(),
        message: message,
        message_id: allMessages.length + 1,
        receiver:
          currentChat.members[0] == address
            ? currentChat.members[1]
            : currentChat.members[0],
        sender: address,
        currentChat: currentChat,
      };

      const messageModel = {
        date: Date.now(),
        message: message,
        message_id: payload.message_id,
        receiver: payload.receiver,
        sender: payload.sender,
      };

      fakeMessageSet(messageModel).then(() => {
        messagesScroll.current.scrollIntoView({ behavior: "smooth" });
      });

      const response = await axios.post("chats/messages/add", payload);
      if (response.data.err) {
        setSendingMessage(false);
        setMessage("");
        toast(response.data.err, {
          type: "error",
        });
      } else {
        socket.emit("sendMessage", {
          message: response.data.message,
          currentChat: response.data.newCurrentChat,
        });
        setAllMessages((allMessages) => [
          ...allMessages,
          response.data.message,
        ]);
        setSendingMessage(false);
        setMessage("");
        setFakeMessage(null);
        messagesScroll.current.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setSendingMessage(false);
      setMessage("");
      toast("Please do not leave blank space!", {
        type: "info",
      });
    }
  };

  const getChats = async () => {
    setAllChatsLoading(true);
    const chats = await axios.post("chats", {
      address: address,
    });
    if (chats.data.length > 0) {
      setAllChats(chats.data);
      setAllChatsLoading(false);
    } else {
      setAllChats([]);
      setAllChatsLoading(false);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files[0];
    const size = file.size;
    if (size >= 2500000) {
      toast("Maximum file / image upload limit is 25 MB!", {
        type: "error",
      });
      setCurrentFakePathImage(null);
      setCurrentImage("");
    } else {
      setCurrentFakePathImage(URL.createObjectURL(file));
      setCurrentImage(file);
      window.$("#send-file").modal("show");
    }
  };

  const sendFastMessage = async () => {
    if (fast_message) {
      const user = fastMessageAddress;
      setSendingFastMessage(true);
      setSendingMessage(false);
      const CHAT_ID = makeId(16);
      const payload = {
        chat_id: CHAT_ID,
        members: [address, user],
        last_message: {
          message: fast_message,
          message_id: allMessages.length + 1,
          seen: false,
          user_id: address,
          date: Date.now(),
        },
      };
      const response = await axios.post("chats/messages/searchAdd", payload);
      if (response.data.err) {
        window.$("#fast-send-message").modal("hide");
        window.$(".modal-backdrop").remove();
        setSendingMessage(false);
        setSendingFastMessage(false);
        setMessage("");
        toast(response.data.err, {
          type: "error",
        });
      } else {
        window.$("#fast-send-message").modal("hide");
        window.$(".modal-backdrop").remove();

        setSendingFastMessage(false);
        socket.emit("sendMessage", {
          message: response.data.message,
          currentChat: response.data.newCurrentChat,
        });
        chat(payload);
      }
    } else {
      setSendingFastMessage(false);
      setSendingMessage("");
      setMessage("");
      setFakeMessage("");
      toast("Please do not leave blank space!", {
        type: "info",
      });
    }
  };

  const searchChat = async (user) => {
    const found = await allChats.find(
      (chatItem) => chatItem.members[0] == user || chatItem.members[1] == user
    );
    if (found) {
      window.$("#fast-send-message").modal("hide");
      window.$("#search-users").modal("hide");
      window.$(".modal-backdrop").remove();
      chat(found);
    } else {
      setFastMessageAddress(user);
      window.$("#search-users").modal("hide");
      window.$("#fast-send-message").modal("show");
    }
  };

  const refuseFile = () => {
    setCurrentImage("");
    setCurrentFakePathImage("");
    fileInput.current.value = null;
    window.$("#send-file").modal("hide");
  };

  const fetchFilesorMessages = async () => {
    setAllFilesLoading(true);
    setAllFiles([]);
    const id = localStorage.getItem("23a41b63z0c853cfj");
    const response = await axios.post("chats/files", {
      chatID: id,
    });
    if (response.data.err) {
      setAllFiles([]);
      setAllFilesLoading(false);
      toast(res.data.success, {
        type: "error",
      });
    } else {
      setAllFiles(response.data.files);
      setAllFilesLoading(false);
    }
  };

  const renderFilesorImages = () => {
    if (!allFilesLoading && allFiles.length === 0) {
      return (
        <h6 className="m-0 p-0 text-center text-white">
          No file(s)/image(s) yet...
        </h6>
      );
    } else if (allFilesLoading && allFiles.length === 0) {
      return <h6 className="m-0 p-0 text-center text-white">Loading...</h6>;
    } else {
      return (
        <ul>
          {allFiles.map((fileItem, index) => {
            return (
              <li key={index}>
                <a
                  href={`${NGROK}upload/${fileItem.file.file_address}`}
                  target="_blank"
                >
                  {fileItem.file.file_address}
                </a>
              </li>
            );
          })}
        </ul>
      );
    }
  };

  const renderSearchArea = () => {
    if (blockchainUsersLoading && !searchInput && allUsersData.length == 0) {
      return (
        <div
          style={{
            height: 200,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ lineHeight: 14 }}>
            <p className="m-0 p-0 text-white text-center">
              Fetching users from blockchain please wait...
            </p>
          </div>
        </div>
      );
    } else if (
      !blockchainUsersLoading &&
      !searchInput &&
      blockChainUsers.length > 0
    ) {
      return (
        <div style={{ lineHeight: 14 }}>
          <p className="m-0 p-0 text-white text-center">
            Users loaded, you can search!
          </p>
        </div>
      );
    } else if (
      !blockchainUsersLoading &&
      searchInput &&
      allUsersData.length > 0
    ) {
      return (
        <div style={{ height: 350, overflow: "auto", clear: "both" }}>
          {allUsersData.map((user, index) => {
            return (
              <a
                type="button"
                onClick={() => searchChat(user)}
                key={index}
                className="text-reset nav-link p-0 mb-6"
              >
                <div className="card card-active-listener">
                  <div className="card-body">
                    <div className="media">
                      <div
                        className="avatar mr-5"
                        style={{
                          background: "#fff",
                          color: "#000",
                          borderRadius: 100 + "%",
                          alignItems: "center",
                          justifyContent: "center",
                          display: "flex",
                        }}
                      >
                        {user.slice(0, 4)}
                      </div>
                      <div className="media-body overflow-hidden">
                        <div className="d-flex align-items-center mb-1">
                          <h6 className="text-truncate mb-0 mr-auto">{user}</h6>
                        </div>
                        <div className="text-truncate">Click to chat...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      );
    } else {
      return (
        <div style={{ lineHeight: 14 }}>
          <p className="m-0 p-0 text-white text-center">No user found!</p>
        </div>
      );
    }
  };

  const renderChats = () => {
    if (allChatsLoading) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            margin: "auto",
          }}
        >
          <DotLoader color={"#fff"} loading={true} size={40} />
          <p className="text-center mt-3 text-white">Chats loading...</p>
        </div>
      );
    } else if (!allChatsLoading && allChats.length == 0) {
      return (
        <p className="text-center mt-3 text-white">No conversation yet...</p>
      );
    } else {
      return allChats.map((chatItem, index) => {
        return (
          <a
            key={index}
            className="text-reset nav-link p-0 mb-6"
            style={
              localStorage.getItem("23a41b63z0c853cfj") === chatItem.chat_id
                ? null
                : { cursor: "pointer" }
            }
            onClick={() =>
              localStorage.getItem("23a41b63z0c853cfj") === chatItem.chat_id
                ? null
                : chat(chatItem)
            }
          >
            <div
              className="card card-active-listener"
              style={
                localStorage.getItem("23a41b63z0c853cfj") == chatItem.chat_id &&
                chatPage === true
                  ? { backgroundColor: "rgb(40,234,104, 0.2)", color: "#fff" }
                  : chatItem.last_message.seen == false &&
                    chatItem.last_message.user_id != address
                  ? { borderWidth: 2, borderColor: "#28ea68" }
                  : null
              }
            >
              <div className="card-body">
                <div className="media">
                  <div
                    className="avatar mr-5"
                    style={{
                      background: "#fff",
                      color: "#000",
                      borderRadius: 100 + "%",
                      alignItems: "center",
                      justifyContent: "center",
                      display: "flex",
                    }}
                  >
                    {chatItem.members[0] == address
                      ? chatItem.members[1].slice(0, 4)
                      : chatItem.members[0].slice(0, 4)}
                  </div>
                  <div className="media-body overflow-hidden">
                    <div className="d-flex align-items-center mb-1">
                      <h6 className="text-truncate mb-0 mr-auto">
                        {chatItem.members[0] == address
                          ? chatItem.members[1]
                          : chatItem.members[0]}
                      </h6>
                      <p className="small text-muted text-nowrap ml-4">
                        {moment(chatItem.last_message.date).calendar()}
                      </p>
                    </div>
                    <div className="text-truncate">
                      {chatItem.last_message.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        );
      });
    }
  };
  const renderOtherMessage = ({ messageItem, index }) => {
    return (
      <div key={index} className="message" style={{ marginBottom: "0.5rem" }}>
        <div className="message-body">
          <div
            className="message-row"
            style={{ display: "block", clear: "both" }}
          >
            <div
              className="d-flex align-items-center"
              style={{ display: "block", clear: "both" }}
            >
              {messageItem.file
                ? renderFileMessage(messageItem)
                : renderNormalMessage(messageItem)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderMyMessage = ({ messageItem, index }) => {
    return (
      <div
        key={index}
        className="message-right mb-3"
        style={{
          display: "flexbox",
        }}
      >
        <div className="message-body">
          <div
            className="message-row"
            style={{ display: "block", clear: "both" }}
          >
            <div
              className={"d-flex align-items-center justify-content-end"}
              style={{ display: "block", clear: "both" }}
            >
              {messageItem.file
                ? renderFileMessage(messageItem)
                : renderNormalMessage(messageItem)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderFileMessage = (messageItem) => {
    if (
      messageItem.file.file_extension == ".png" ||
      messageItem.file.file_extension == ".jpg" ||
      messageItem.file.file_extension == ".jpeg" ||
      messageItem.file.file_extension == ".jfif" ||
      messageItem.file.file_extension == ".webp" ||
      messageItem.file.file_extension == ".svg" ||
      messageItem.file.file_extension == ".gif"
    ) {
      return (
        <div
          className={
            "message-content " +
            (messageItem.sender != address
              ? "bg-light"
              : "bg-primary text-white")
          }
        >
          <div className="media">
            <div className="media-body overflow-hidden flex-fill">
              <a
                data-fancybox="gallery"
                href={`${NGROK}upload/${messageItem.file.file_address}`}
              >
                <img
                  onLoad={() => {
                    messagesScroll.current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  src={`${NGROK}upload/${messageItem.file.file_address}`}
                  style={{
                    width: 400,
                    height: 400,
                    objectFit: "cover",
                    borderRadius: 16,
                  }}
                />
              </a>
              <ul className="list-inline small mb-0 mt-2">
                <li className="list-inline-item">
                  <span className="t">
                    {moment(messageItem.date).calendar()}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={
            "message-content " +
            (messageItem.sender != address
              ? "bg-light"
              : "bg-primary text-white")
          }
        >
          <div className="media">
            <a
              href="#"
              className="text-dark text-black bg-basic-inverse icon-shape mr-5"
            >
              <i className="fe-paperclip"></i>
            </a>
            <div className="media-body overflow-hidden flex-fill">
              <a
                href={`${NGROK}upload/${messageItem.file.file_address}`}
                target="_blank"
                className="d-block text-truncate font-medium text-reset"
              >
                {messageItem.file.file_address}
              </a>
              <ul className="list-inline small mb-0">
                <li className="list-inline-item">
                  <span className="t">
                    {moment(messageItem.date).calendar()}
                  </span>
                </li>
                <li className="list-inline-item">
                  <span className="text-uppercase">
                    {messageItem.file.file_extension}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
  };
  const renderNormalMessage = (messageItem) => {
    return (
      <div
        style={{
          display: "inline-block",
          maxHeight: 100 + "%",
          maxWidth: 100 + "%",
        }}
        className={
          "message-content " +
          (messageItem.sender != address ? "bg-light" : "bg-primary text-white")
        }
      >
        <div>
          <p className="m-0 p-0">{messageItem.message}</p>
        </div>
        <div className="mt-1">
          <small className="opacity-65">
            {moment(messageItem.date).calendar()}
          </small>
        </div>
      </div>
    );
  };
  const renderSeen = () => {
    if (currentChat) {
      if (
        currentChat.last_message.user_id === address &&
        currentChat.last_message.seen === true
      ) {
        return (
          <span
            style={{ fontSize: 12 }}
            className="small text-muted text-nowrap"
          >
            Read
          </span>
        );
      }
    }
  };
  const renderFakeMessage = () => {
    return (
      <div className="message-right mb-3" style={{ opacity: 0.4 }}>
        <div className="message-body">
          <div
            className="message-row"
            style={{ display: "block", clear: "both" }}
          >
            <div
              className={"d-flex align-items-center justify-content-end"}
              style={{ display: "block", clear: "both" }}
            >
              <div
                style={{
                  display: "inline-block",
                  maxHeight: 100 + "%",
                  maxWidth: 100 + "%",
                  display: "flex",
                  alignItems: "center",
                }}
                className="message-content bg-primary text-white"
              >
                <div style={{ marginRight: 20 }}>
                  <DotLoader css={override} color={"#fff"} loading={true} size={25} />
                  <br />
                </div>
                <div style={{ flexDirection: "column" }}>
                  <div>
                    {fakeMessage.file ? (
                      fakeMessage.file.file_extension === "image/png" ||
                      fakeMessage.file.file_extension === "image/jpg" ||
                      fakeMessage.file.file_extension === "image/jpeg" ||
                      fakeMessage.file.file_extension === "image/jfif" ||
                      fakeMessage.file.file_extension === "image/webp" ||
                      fakeMessage.file.file_extension === "image/svg" ||
                      fakeMessage.file.file_extension === "image/gif" ? (
                        <img
                          style={{
                            width: 400,
                            height: 100 + "%",
                            objectFit: "contain",
                          }}
                          src={fakeMessage.file.file_address}
                        />
                      ) : (
                        "File / Image"
                      )
                    ) : (
                      <p className="m-0 p-0">{fakeMessage.message}</p>
                    )}
                  </div>
                  <div className="mt-1">
                    <small className="opacity-65">
                      {moment(fakeMessage.date).calendar()}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderAllMessages = () => {
    if (allMessages.length == 0 && messagesLoading) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            margin: "auto",
            height: 100 + "%",
            width: 100 + "%",
            marginTop: 15,
          }}
        >
          <DotLoader color={"#fff"} loading={true} size={40} />
          <p className="text-center mt-3 text-white">Messages loading...</p>
        </div>
      );
    } else if (allMessages.length == 0 && !messagesLoading) {
      return (
        <div
          className="alert text-white text-center"
          style={{ background: "#28ea68" }}
        >
          Write a message to start the conversation.
        </div>
      );
    } else if (allMessages.length > 0 && !messagesLoading) {
      return allMessages.map((messageItem, index) => {
        if (messageItem.sender == address)
          return renderMyMessage({ messageItem, index });
        else return renderOtherMessage({ messageItem, index });
      });
    }
  };

  const renderFakeImage = () => {
    if (currentImage) {
      if (
        currentImage.type == "image/png" ||
        currentImage.type == "image/jpg" ||
        currentImage.type == "image/jpeg" ||
        currentImage.type == "image/jfif" ||
        currentImage.type == "image/webp" ||
        currentImage.type == "image/svg" ||
        currentImage.type == "image/gif"
      ) {
        return (
          <a data-fancybox="gallery" href={fakePathImage}>
            <img
              src={fakePathImage}
              width={400}
              style={{ objectFit: "cover", borderRadius: 16 }}
            />
          </a>
        );
      } else {
        return (
          <h5
            style={{
              fontSize: 25,
              fontWeight: "bold",
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {currentImage.name}
          </h5>
        );
      }
    }
  };

  useEffect(() => {
    if (address) {
      async function workerAndSocket() {
        const worker = await navigator.serviceWorker.ready;
        const clientJSON = await worker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            "BCV3vnako6igrHlSGT6p7819re3QynCPDsoPXUSzxj8vP7_6rTAErr1SO0cfcLSvZuiYdN57h7PgX6l1tUx542s",
        });
        const json = JSON.stringify(clientJSON);
        const parsedData = JSON.parse(json);
        if (clientJSON) {
          const payload = {
            client: parsedData,
            address: address,
          };
          socket.emit("newUser", payload);
        }
      }
      workerAndSocket();

      socket.on("newChats", (data) => {
        setAllChats(data);

        data.forEach((chatItem) => {
          if (chatItem.chat_id === localStorage.getItem("23a41b63z0c853cfj")) {
            setCurrentChat(chatItem);
            setChatPage(true);
            messagesScroll.current.scrollIntoView({ behavior: "smooth" });
          }
        });
      });

      getChats();
    }
  }, [address]);

  useEffect(() => {
    if (localStorage.getItem("23a41b63z0c853cfj")) {
      socket.on("newMessage", async (payload) => {
        if (
          localStorage.getItem("23a41b63z0c853cfj") ===
          payload.currentChat.chat_id
        ) {
          const found = await allMessages.find(
            (message) => message.message_id !== payload.message.message_id
          );
          if (!found) {
            setAllMessages((allMessages) => [...allMessages, payload.message]);
            changeTyping(false).then(() => {
              messagesScroll.current.scrollIntoView({ behavior: "smooth" });
            });
            await axios.post("chats/messages/seen", {
              chat_id: payload.currentChat.chat_id,
            });
          }
        } else {
          var audio = document.getElementById("a1");
          audio.muted = true;
          audio.play();
          audio.muted = false;
          audio.play();
        }
      });
    }
  }, [localStorage.getItem("23a41b63z0c853cfj")]);

  useEffect(() => {
    if (currentChat) {
      socket.on("typingServer", (chat_id) => {
        if (localStorage.getItem("23a41b63z0c853cfj") === chat_id) {
          changeTyping(true).then(() => {
            messagesScroll.current.scrollIntoView({ behavior: "smooth" });
          });
        }
      });
      socket.on("typingStopServer", (chat_id) => {
        if (localStorage.getItem("23a41b63z0c853cfj") === chat_id) {
          changeTyping(false).then(() => {
            messagesScroll.current.scrollIntoView({ behavior: "smooth" });
          });
        }
      });
    }
  }, [currentChat]);
  const renderTyping = () => {
    return (
      <div className="message" style={{ marginBottom: "0.5rem" }}>
        <div className="message-body">
          <div className="message-row">
            <div className="d-flex align-items-center">
              <div className="message-content bg-light">
                <div>
                  {" "}
                  User typing{" "}
                  <span className="typing-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const changeTyping = async (bool) => {
    setTyping(bool);
  };

  return (
    <>
      <Head>
        <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css"
        />
        <script src="https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js"></script>
      </Head>
      <ToastContainer
        position="top-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="layout">
        <div className="navigation navbar navbar-light justify-content-center py-xl-7">
          <a href="#" className="d-none d-xl-block mb-6">
            <img
              src="assets/img/logo/argon-cmc-logo.png"
              className="mx-auto fill-primary"
              data-inject-svg
              alt
              style={{ height: 46 }}
            />
          </a>
          <ul
            className="nav navbar-nav flex-row flex-xl-column flex-grow-1 justify-content-between justify-content-xl-center py-3 py-lg-0"
            role="tablist"
          >
            <li className="nav-item mt-xl-9">
              <a
                className="nav-link position-relative p-0 py-xl-3 active"
                data-toggle="tab"
                href="#tab-content-dialogs"
                title="Chats"
                role="tab"
              >
                <i className="icon-lg fe-message-square" />
                <div className="badge badge-dot badge-primary badge-bottom-center" />
              </a>
            </li>
          </ul>
        </div>
        <div className="sidebar">
          <div className="tab-content h-100" role="tablist">
            <div
              className="tab-pane fade h-100 show active"
              id="tab-content-dialogs"
              role="tabpanel"
            >
              <div className="d-flex flex-column h-100">
                <div className="hide-scrollbar">
                  <div className="container-fluid py-6">
                    <h2 className="font-bold mb-6">Chats</h2>
                    <div className="mb-6">
                      <div className="input-group">
                        <input
                          type="button"
                          className="btn btn-primary btn-block"
                          style={{ backgroundColor: "#28ea68" }}
                          value="Search users..."
                          data-toggle="modal"
                          data-target="#search-users"
                        />
                      </div>
                    </div>
                    <nav
                      className="nav d-block list-discussions-js mb-n6"
                      style={{ height: 100 + "%" }}
                    >
                      {renderChats()}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!currentChat ? (
          <div
            className="main main-visible"
            id="main-start-page"
            data-mobile-height
          >
            <audio id="a1" src="assets/sound/notification.mp3"></audio>
            <div className="chat flex-column justify-content-center text-center">
              <div className="container-xxl">
                <h1>Welcome</h1>
                <p>{address}</p>
              </div>
            </div>
          </div>
        ) : (
          <div id="chat-page" className="main" data-mobile-height>
            <audio id="a1" src="assets/sound/notification.mp3"></audio>
            <div id="chat-1" className="chat dropzone-form-js">
              <div className="chat-body">
                <div className="chat-header border-bottom py-4 py-lg-6 px-lg-8">
                  <div className="container-xxl">
                    <div className="row align-items-center">
                      <div className="col-3 d-xl-none">
                        <ul className="list-inline mb-0">
                          <li className="list-inline-item">
                            <a
                              className="text-muted px-0"
                              style={{ cursor: "pointer" }}
                              data-chat="open"
                              href=""
                            >
                              <i className="icon-md fe-chevron-left" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="col-6 col-xl-6">
                        <div className="media">
                          <div
                            className="avatar avatar-sm"
                            style={{
                              background: "#fff",
                              color: "#000",
                              borderRadius: 100 + "%",
                              alignItems: "center",
                              justifyContent: "center",
                              display: "flex",
                              marginRight: 12,
                            }}
                          >
                            {currentChat.members[0] == address
                              ? currentChat.members[1].slice(0, 4)
                              : currentChat.members[0].slice(0, 4)}
                          </div>
                          <div className="media-body align-self-center text-truncate">
                            <h6 className="text-truncate mb-n1">
                              {currentChat.members[0] == address
                                ? currentChat.members[1]
                                : currentChat.members[0]}
                            </h6>
                          </div>
                        </div>
                      </div>
                      <div className="col-3 col-xl-6 text-right">
                        <ul className="nav justify-content-end">
                          <li className="nav-item list-inline-item d-none d-xl-block mr-0">
                            <a
                              className="nav-link text-muted px-3"
                              style={{ cursor: "pointer" }}
                              data-toggle="modal"
                              data-target="#filesModal"
                              onClick={() => fetchFilesorMessages()}
                              data-chat-sidebar-toggle="#chat-1-info"
                              title="Details"
                            >
                              <i className="icon-md fe-more-vertical" />
                            </a>
                          </li>
                          <li className="nav-item list-inline-item d-block d-xl-none">
                            <div className="dropdown">
                              <a
                                className="nav-link text-muted px-0"
                                href="#"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                <i className="icon-md fe-more-vertical" />
                              </a>
                              <div className="dropdown-menu">
                                <a
                                  className="dropdown-item d-flex align-items-center"
                                  data-toggle="collapse"
                                  data-target="#chat-1-search"
                                  href="#"
                                >
                                  Search{" "}
                                  <span className="ml-auto pl-5 fe-search" />
                                </a>
                                <a
                                  className="dropdown-item d-flex align-items-center"
                                  href="#"
                                  data-chat-sidebar-toggle="#chat-1-info"
                                >
                                  Chat Info{" "}
                                  <span className="ml-auto pl-5 fe-more-horizontal" />
                                </a>
                                <a
                                  className="dropdown-item d-flex align-items-center"
                                  data-target="#invite-friends"
                                  data-toggle="modal"
                                  data-chat-sidebar-toggle="#chat-1-members"
                                >
                                  Add Members{" "}
                                  <span className="ml-auto pl-5 fe-user-plus" />
                                </a>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="collapse border-bottom px-lg-8"
                  id="chat-1-search"
                >
                  <div className="container-xxl py-4 py-lg-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Search this chat"
                        aria-label="Search this chat"
                      />
                      <div className="input-group-append">
                        <button
                          className="btn btn-lg btn-ico btn-secondary btn-minimal"
                          type="submit"
                        >
                          <i className="fe-search" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chat-content px-lg-8">
                  <div className="container-xxl mt-4">
                    {renderAllMessages()}
                    {fakeMessage ? renderFakeMessage() : null}

                    <div
                      style={{
                        justifyContent: "flex-end",
                        alignSelf: "flex-end",
                        textAlign: "right",
                        marginTop: 8,
                        marginBottom: 8,
                      }}
                    >
                      {renderSeen()}
                    </div>

                    {typing ? renderTyping() : null}
                    <div ref={messagesScroll || null}></div>
                  </div>
                  <div className="end-of-chat" />
                </div>
                <div className="chat-files hide-scrollbar px-lg-8">
                  <div className="container-xxl">
                    <div className="dropzone-previews-js form-row py-4" />
                  </div>
                </div>
                <div className="chat-footer border-top py-4 py-lg-6 px-lg-8">
                  <div className="container-xxl">
                    <form
                      onSubmit={(e) => (!sendingMessage ? sendMessage(e) : {})}
                      data-emoji-form
                    >
                      <div className="form-row align-items-center">
                        <div className="col">
                          <div className="input-group">
                            <input
                              id="chat-id-1-input"
                              className="form-control bg-transparent border-0"
                              placeholder="Type your message..."
                              autoComplete="off"
                              disabled={sendingMessage ? "disabled" : null}
                              onChange={({ target }) =>
                                handleMessage(target.value)
                              }
                              value={message}
                              data-autosize="true"
                              defaultValue={""}
                            />

                            <div className="input-group-append">
                              <button
                                id="chat-upload-btn-1"
                                className="btn btn-ico btn-light btn-minimal bg-transparent border-0 dropzone-button-js"
                                type="button"
                                onClick={() => fileInput.current.click()}
                              >
                                <i
                                  className="fe-paperclip"
                                  style={{ color: "#fff", fontSize: 23 }}
                                ></i>
                              </button>
                              <input
                                type="file"
                                className="d-none"
                                ref={fileInput}
                                onChange={handleFile}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-auto">
                          <button
                            disabled={sendingMessage ? "disabled" : null}
                            className="btn btn-ico btn-primary rounded-circle"
                            type="submit"
                          >
                            <span className="fe-send" />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div id="chat-1-info" className="chat-sidebar">
                <div className="d-flex h-100 flex-column">
                  <div className="hide-scrollbar flex-fill">
                    <i
                      className="fe-arrow-left"
                      style={{
                        fontSize: 35,
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    />
                    <ul
                      className="nav nav-tabs nav-justified bg-light rounded-0"
                      role="tablist"
                    >
                      <li className="nav-item">
                        <a
                          href="#chat-id-1-files"
                          className="nav-link active"
                          data-toggle="tab"
                          role="tab"
                        >
                          Files
                        </a>
                      </li>
                    </ul>
                    <div className="tab-content">
                      <div
                        id="chat-id-1-files"
                        className="tab-pane fade show active"
                      >
                        <ul className="list-group list-group-flush list-group-no-border-first">
                          render files
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="chat-1-user-profile" className="chat-sidebar">
                <div className="d-flex h-100 flex-column">
                  <div className="border-bottom py-4 py-lg-6">
                    <div className="container-fluid">
                      <ul className="nav justify-content-between align-items-center">
                        <li className="nav-item list-inline-item">
                          <a
                            className="nav-link text-muted px-0"
                            href="#"
                            data-chat-sidebar-close
                          >
                            <i className="icon-md fe-chevron-left" />
                          </a>
                        </li>
                        <li className="text-center d-block d-lg-none">
                          <h6 className="mb-n2">William Wright</h6>
                          <small className="text-muted">User Details</small>
                        </li>
                        <li className="nav-item list-inline-item">
                          <div className="dropdown">
                            <a
                              className="nav-link text-muted px-0"
                              href="#"
                              data-toggle="dropdown"
                              aria-haspopup="true"
                              aria-expanded="false"
                            >
                              <i className="icon-md fe-sliders" />
                            </a>
                            <div className="dropdown-menu">
                              <a
                                className="dropdown-item d-flex align-items-center"
                                href="#"
                              >
                                Mute <span className="ml-auto fe-bell" />
                              </a>
                              <a
                                className="dropdown-item d-flex align-items-center"
                                href="#"
                              >
                                Delete <span className="ml-auto fe-trash-2" />
                              </a>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="hide-scrollbar flex-fill">
                    <div className="border-bottom text-center py-9 px-10">
                      <div className="avatar avatar-xl mx-5 mb-5">
                        <img
                          className="avatar-img"
                          src="chat_platform/images/avatars/9.jpg"
                          alt
                        />
                        <div className="badge badge-sm badge-pill badge-primary badge-border-basic badge-top-right">
                          <span className="text-uppercase">Pro</span>
                        </div>
                      </div>
                      <h5>William Wright</h5>
                      <p className="text-muted">
                        Bootstrap is an open source toolkit for developing web
                        with HTML, CSS, and JS.
                      </p>
                    </div>
                    <ul className="list-group list-group-flush mb-8">
                      <li className="list-group-item py-6">
                        <div className="media align-items-center">
                          <div className="media-body">
                            <p className="small text-muted mb-0">Country</p>
                            <p>Warsaw, Poland</p>
                          </div>
                          <i className="text-muted icon-sm fe-globe" />
                        </div>
                      </li>
                      <li className="list-group-item py-6">
                        <div className="media align-items-center">
                          <div className="media-body">
                            <p className="small text-muted mb-0">Phone</p>
                            <p>+39 02 87 21 43 19</p>
                          </div>
                          <i className="text-muted icon-sm fe-mic" />
                        </div>
                      </li>
                      <li className="list-group-item py-6">
                        <div className="media align-items-center">
                          <div className="media-body">
                            <p className="small text-muted mb-0">Email</p>
                            <p>anna@gmail.com</p>
                          </div>
                          <i className="text-muted icon-sm fe-mail" />
                        </div>
                      </li>
                      <li className="list-group-item py-6">
                        <div className="media align-items-center">
                          <div className="media-body">
                            <p className="small text-muted mb-0">Time</p>
                            <p>10:03 am</p>
                          </div>
                          <i className="text-muted icon-sm fe-clock" />
                        </div>
                      </li>
                    </ul>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item py-6">
                        <a href="#" className="media text-muted">
                          <div className="media-body align-self-center">
                            Twitter
                          </div>
                          <i className="icon-sm fe-twitter" />
                        </a>
                      </li>
                      <li className="list-group-item py-6">
                        <a href="#" className="media text-muted">
                          <div className="media-body align-self-center">
                            Facebook
                          </div>
                          <i className="icon-sm fe-facebook" />
                        </a>
                      </li>
                      <li className="list-group-item py-6">
                        <a href="#" className="media text-muted">
                          <div className="media-body align-self-center">
                            Github
                          </div>
                          <i className="icon-sm fe-github" />
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div className="border-top py-7">
                    <div className="container-fluid">
                      <button
                        className="btn btn-lg btn-block btn-primary d-flex align-items-center"
                        type="submit"
                      >
                        Add friend
                        <span className="fe-user-plus ml-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="modal fade" id="send-file">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="media flex-fill">
                <div className="icon-shape rounded-lg bg-primary text-white mr-5">
                  <i className="fe-paperclip" />
                </div>
                <div className="media-body align-self-center">
                  <h5 className="modal-title">File Send</h5>
                </div>
              </div>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  window.$(".modal-backdrop").remove();
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <div className="mb-3">{renderFakeImage()}</div>
                <div>Do You Confirm ?</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => sendFile(currentImage)}
                className="btn btn-lg btn-block btn-primary d-flex align-items-center"
                data-dismiss="modal"
                aria-label="Close"
              >
                Approve
                <i className="fe-check ml-auto" />
              </button>
              <button
                type="button"
                onClick={() => refuseFile()}
                className="btn btn-lg btn-block btn-danger d-flex align-items-center"
                data-dismiss="modal"
                aria-label="Close"
              >
                Refuse
                <span className="ml-auto">x</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal fade" id="search-users">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="media flex-fill">
                <div className="icon-shape rounded-lg bg-primary text-white mr-5">
                  <i className="fe-users" />
                </div>
                <div className="media-body align-self-center">
                  <h5 className="modal-title">All Users</h5>
                </div>
              </div>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  window.$(".modal-backdrop").remove();
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form className="mb-6">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search users..."
                    onChange={(e) =>
                      !blockchainUsersLoading ? handleChange(e) : null
                    }
                    disabled={blockchainUsersLoading ? "disabled" : null}
                    value={searchInput}
                    aria-label="Search users..."
                  />
                </div>
              </form>
              <hr />

              {renderSearchArea()}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-lg btn-block btn-danger d-flex align-items-center"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  window.$(".modal-backdrop").remove();
                }}
              >
                Close window
                <span className="ml-auto">x</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal fade" id="fast-send-message">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="media flex-fill">
                <div className="icon-shape rounded-lg bg-grey text-white mr-5">
                  <i className="fe-users" />
                </div>
                <div className="media-body align-self-center">
                  <h5 className="modal-title">Send Message</h5>
                </div>
              </div>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  window.$("#search-users").modal("show");
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center text-white mb-4 mt-2">
                <p className="p-0 m-0 text-center">
                  Start a conversation with <b>{fastMessageAddress}</b>
                </p>
              </div>
              <form className="mb-6">
                <div className="input-group">
                  <textarea
                    onChange={({ target }) => setFastMessage(target.value)}
                    defaultValue={fast_message}
                    placeholder="Type your message here..."
                    rows={4}
                    className="form-control"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                style={sendingFastMessage ? { opacity: 0.5 } : null}
                className="btn btn-lg btn-block btn-primary text-white d-flex align-items-center"
                disabled={sendingFastMessage ? "disabled" : null}
                onClick={() => (!sendingFastMessage ? sendFastMessage() : null)}
              >
                {sendingFastMessage ? "Sending..." : "Send"}
                <span className="ml-auto text-white">
                  <i className="fa fa-check"></i>
                </span>
              </button>
              {sendingFastMessage ? null : (
                <button
                  type="button"
                  className="btn btn-lg btn-block btn-danger d-flex align-items-center"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    window.$("#search-users").modal("show");
                  }}
                >
                  Cancel
                  <span className="ml-auto">x</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal fade" id="filesModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="media flex-fill">
                <div className="icon-shape rounded-lg bg-grey text-white mr-5">
                  <i className="fe-file" />
                </div>
                <div className="media-body align-self-center">
                  <h5 className="modal-title">All Files / Images</h5>
                </div>
              </div>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  window.$(".modal-backdrop").remove();
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center text-white mb-4 mt-2">
                <p className="p-0 m-0 text-center">
                  All Files or Images listing...
                </p>
              </div>
              <div style={{ overflow: "auto", height: 400 }}>
                {renderFilesorImages()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="myModal"></div>
      <style jsx>{`
        :: -webkit - scrollbar {
          width: 10px;
        }

        /* Track */

        :: -webkit - scrollbar - track {
          background: #f1f1f1;
        }

        /* Handle */

        :: -webkit - scrollbar - thumb {
          background: #888;
        }

        /* Handle on hover */

        :: -webkit - scrollbar - thumb: hover {
          background: #555;
        }
      `}</style>
    </>
  );
}

export default inbox;
