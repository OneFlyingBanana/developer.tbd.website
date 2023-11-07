import { useState, useEffect } from "react";
import { Web5 } from "@web5/api";
import { CircleLoader } from "react-spinners";

const { web5 } = await Web5.connect();
const { record } = await Web5.dwn.records.create({
  data: "Yo Web5, this is Roald!",
  message: {
    dataFormat: 'text/plain'// possible to update different DIDs that have given me access
  },
});

export default function CRUDPage() {
  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [data, setData] = useState([]);
  const [updateDataInput, setUpdateDataInput] = useState(""); // For updateData
  const [deleteDataInput, setDeleteDataInput] = useState(""); // For deleteData
  const [isLoading, setIsLoading] = useState(true);

  const updateData = async (record) => {
    const updateResult = await record.update({
      data: "Hello, Web5! I am updated.",
      message: {
        dataFormat: 'text/plain'// possible to update different DIDs that have given me access
      },
    });
    console.log(updateResult);
    return updateResult;
  };

  const deleteData = async (record) => {
    const deleteResult = await record.delete();
    console.log(deleteResult);
    return deleteResult;
  };

  const showData = async (record) => {
    const data = await record.data.text();
    console.log(data);
    return data;
  };

  return (
    <div className="app-container">
      {isLoading ? (
        <div className="loading">
          <CircleLoader
            color={"#000000"}
            loading={isLoading}
            size={150}
            aria-label="Loading Spinner"
            data-testid="loader"
            margin={2}
          />
          <p>Loading CRUD Test Page</p>
        </div>
      ) : (
        <div>
          <header>
            <h1>CRUD Operations Testing Page</h1>
          </header>
          <div className="crud-page">
            <div className="input-group">
              <input
                type="text"
                value={updateDataInput}
                onChange={(e) => setUpdateDataInput(e.target.value)}
              />
              <button onClick={() => updateData(data[0])}>Update Data</button>
            </div>

            <div className="input-group">
              <input
                type="text"
                value={deleteDataInput}
                onChange={(e) => setDeleteDataInput(e.target.value)}
              />
              <button onClick={() => deleteData(data[0])}>Delete Data</button>
            </div>
            <div className="input-group">
              <textarea readOnly value={showData} />
              <button onClick={() => showData()}>Show Data</button>
            </div>
            <p style={{ wordWrap: "break-word" }}>My DID : {myDid}</p>
          </div>
        </div>
      )}
    </div>
  );
}
