import { Web5 } from "@web5/api";
import { useState, useEffect } from "react";
import { NoChatSelected } from "@/components/NoChatSelected";
import { Sidebar } from "@/components/Sidebar";
import { Chat } from "@/components/Chat";

import Link from "next/link";

import { CircleLoader } from "react-spinners";

export default function Home() {
  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [activeRecipient, setActiveRecipient] = useState(null);

  const [receivedDings, setReceivedDings] = useState([]);
  const [sentDings, setSentDings] = useState([]);

  const [noteValue, setNoteValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [recipientDid, setRecipientDid] = useState("");

  const [didCopied, setDidCopied] = useState(false);
  const [showNewChatInput, setShowNewChatInput] = useState(false);

  const allDings = [...receivedDings, ...sentDings];

  const sortedDings = allDings.sort(
    (a, b) => new Date(a.timestampWritten) - new Date(b.timestampWritten)
  );

  const groupedDings = allDings.reduce((acc, ding) => {
    const recipient = ding.sender === myDid ? ding.recipient : ding.sender;
    if (!acc[recipient]) acc[recipient] = [];
    acc[recipient].push(ding);
    return acc;
  }, {});

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initWeb5 = async () => {
      // Initialise a web5 instance and connect to the network, allowing interaction with Web5 ecosystem
      // Also creates or connects to a DID
      console.time("Web5 connect");
      const { web5, did } = await Web5.connect({ sync: "500ms" });
      console.timeEnd("Web5 connect");

      setWeb5(web5);
      setMyDid(did);

      if (web5 && did) {
        console.time("configure protocol");
        await configureProtocol(web5);
        console.timeEnd("configure protocol");
        console.time("fetch dings");
        await fetchDings(web5, did);
        console.timeEnd("fetch dings");
      }
      setIsLoading(false);
    };
    initWeb5();
  }, []);

  // Fetch dings every 2 seconds
  useEffect(() => {
    if (!web5 || !myDid) return;
    const intervalId = setInterval(async () => {
      await fetchDings(web5, myDid);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [web5, myDid]);

  // Configure the protocol
  const configureProtocol = async (web5) => {
    // Define the protocol, its structure and grants permissions outlining who can do what (read/write)
    const dingerProtocolDefinition = {
      protocol: "https://blackgirlbytes.dev/dinger-chat-protocol",
      published: true,
      types: {
        ding: {
          schema: "https://blackgirlbytes.dev/ding",
          dataFormats: ["application/json"],
        },
      },
      structure: {
        ding: {
          $actions: [
            { who: "anyone", can: "write" },
            { who: "author", of: "ding", can: "read" },
            { who: "recipient", of: "ding", can: "read" },
          ],
        },
      },
    };
    console.log("Dinger protocol definition", dingerProtocolDefinition);

    // Check if the protocol is already configured/exists
    const { protocols, status: protocolStatus } =
      await web5.dwn.protocols.query({
        message: {
          filter: {
            protocol: "https://blackgirlbytes.dev/dinger-chat-protocol",
          },
        },
      });

    // If the protocol is not configured/doesn't exist, configure it/create it
    if (protocolStatus.code !== 200 || protocols.length === 0) {
      const { protocolStatus } = await web5.dwn.protocols.configure({
        message: {
          definition: dingerProtocolDefinition,
        },
      });
      console.log("Configure protocol status", protocolStatus);
    }
  };

  const constructDing = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const ding = {
      sender: myDid,
      note: noteValue,
      recipient: recipientDid,
      timestampWritten: `${currentDate} ${currentTime}`,
    };
    return ding;
  };

  // Store the ding in the DWN
  const writeToDwn = async (ding) => {
    try {
      const { record } = await web5.dwn.records.write({
        data: ding,
        message: {
          protocol: "https://blackgirlbytes.dev/dinger-chat-protocol",
          protocolPath: "ding",
          schema: "https://blackgirlbytes.dev/ding",
          recipient: recipientDid,
        },
      });
      const readResult = await record.data.text();
      console.log("Record", readResult);
      return record;
    } catch (error) {
      console.error("Error writing to DWN:", error);
    }
  };

  // Send the ding to the recipient
  const sendRecord = async (record) => {
    // Sends to ALL DWNs of the recipient
    return await record.send(recipientDid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!noteValue.trim()) {
      setErrorMessage("Please type a message before sending.");
      return;
    }

    const ding = constructDing();
    const record = await writeToDwn(ding);
    console.log("Record", record);
    const { status } = await sendRecord(record);

    console.log("Send record status", status);

    await fetchDings(web5, myDid);
  };

  const handleCopyDid = async () => {
    if (myDid) {
      try {
        await navigator.clipboard.writeText(myDid);
        setDidCopied(true);

        setTimeout(() => {
          setDidCopied(false);
        }, 3000);
      } catch (err) {
        console.log("Failed to copy DID: " + err);
      }
    }
  };

  // Fetch all dings matching the filter from the DWN
  const fetchDings = async (web5, did) => {
    const { records, status: recordStatus } = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: "https://blackgirlbytes.dev/dinger-chat-protocol",
          protocolPath: "ding",
        },
        dateSort: "createdAscending",
      },
    });

    try {
      const results = await Promise.all(
        records.map(async (record) => record.data.json())
      );

      if (recordStatus.code == 200) {
        const received = results.filter((result) => result?.recipient === did);
        const sent = results.filter((result) => result?.sender === did);
        setReceivedDings(received);
        setSentDings(sent);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartNewChat = () => {
    setActiveRecipient(null);
    setShowNewChatInput(true);
  };

  const handleSetActiveRecipient = (recipient) => {
    setRecipientDid(recipient);
    setActiveRecipient(recipient);
    setShowNewChatInput(false);
  };

  const handleConfirmNewChat = () => {
    setActiveRecipient(recipientDid);
    setActiveRecipient(recipientDid);
    setShowNewChatInput(false);
    if (!groupedDings[recipientDid]) {
      groupedDings[recipientDid] = [];
    }
  };

  return (
      <div className="app-container">
        {isLoading ? (
          <div className="loader-container">
            <CircleLoader
              color={"#000000"}
              loading={isLoading}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
              margin={2}
            />
            <p>  </p>
            <p>Loading Web5 ...</p>
          </div>
        ) : (
          <>
            <header>
              <h1>Dinger</h1>
              <Link href="/test">
                <button>Go to Test Page</button>
              </Link>
            </header>
            <main>
              <Sidebar
                groupedDings={groupedDings}
                activeRecipient={activeRecipient}
                handleSetActiveRecipient={handleSetActiveRecipient}
                handleCopyDid={handleCopyDid}
                handleStartNewChat={handleStartNewChat}
                showNewChatInput={showNewChatInput}
                didCopied={didCopied}
                handleConfirmNewChat={handleConfirmNewChat}
                setRecipientDid={setRecipientDid}
                recipientDid={recipientDid}
              />
              <section>
                {activeRecipient ? (
                  <Chat
                    activeRecipient={activeRecipient}
                    sortedDings={sortedDings}
                    myDid={myDid}
                    handleSubmit={handleSubmit}
                    noteValue={noteValue}
                    setNoteValue={setNoteValue}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                  />
                ) : (
                  <NoChatSelected />
                )}
              </section>
            </main>
          </>
        )}
      </div>
  );
}
