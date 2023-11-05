import { useState, useEffect } from "react";
import { Web5 } from "@web5/api";

export default function CRUDPage() {
  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [data, setData] = useState([]);
  const [inputData, setInputData] = useState(''); // For createData
  const [updateDataInput, setUpdateDataInput] = useState(''); // For updateData
  const [deleteDataInput, setDeleteDataInput] = useState(''); // For deleteData
  const [createDataResult, setCreateDataResult] = useState(''); // For displaying createData result
  const [updateDataResult, setUpdateDataResult] = useState(''); // For displaying updateData result
  const [deleteDataResult, setDeleteDataResult] = useState(''); // For displaying deleteData result
  


  useEffect(() => {
    const initWeb5 = async () => {
      const { web5, did } = await Web5.connect({ sync: "1s" });
      setWeb5(web5);
      setMyDid(did);
    };
    initWeb5();
  }, []);

  const createData = async () => {
    const { record } = await web5.dwn.records.create({
      data: 'Hello, Web5!',
      message: {
        dataFormat: 'text/plain',
      },
    });
    console.log("Record : ", record);
    return record;
  };

  const updateData = async (record) => {
    const updateResult = await record.update({
      data: 'Hello, Web5! I am updated.',
    });
    console.log(updateResult);
    return updateResult;
  };

  const deleteData = async (record) => {
    const deleteResult = await record.delete();
    console.log(deleteResult);
    return deleteResult;
  };

  return (
    <div className="crud-page">
      <div className="input-group">
        <input type="text" value={inputData} onChange={e => setInputData(e.target.value)} />
        <button onClick={createData}>Create New Data</button>
        <textarea readOnly value={createDataResult} />
      </div>

      <div className="input-group">
        <input type="text" value={updateDataInput} onChange={e => setUpdateDataInput(e.target.value)} />
        <button onClick={() => updateData(data[0])}>Update Data</button>
        <textarea readOnly value={updateDataResult} />
      </div>

      <div className="input-group">
        <input type="text" value={deleteDataInput} onChange={e => setDeleteDataInput(e.target.value)} />
        <button onClick={() => deleteData(data[0])}>Delete Data</button>
        <textarea readOnly value={deleteDataResult} />
      </div>

      {data.map((item, index) => (
        <div key={index} className="data-item">
          <p>{item.content}</p>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}