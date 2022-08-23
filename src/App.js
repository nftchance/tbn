import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';

import Table from 'rc-table';

import './App.css';

function Tag({ tx, tag, onTagRemove }) {
	return (
		<span className="tag">
			{tag}

			{/* x remove button that calls onTagRemove */}
			<button onClick={() => onTagRemove(tx, tag)}>x</button>
		</span>
	);
}

function App() {
	// create etherscan provider 
	const provider = useMemo(() => new ethers.providers.EtherscanProvider('homestead', '15N9UER5DFTUEJFBPTSRZ9666JYJUX5T27'), []);

	const [address, setAddress] = useState('0x62180042606624f02D8A130dA8A3171e9b33894d');
	const [addressState, setAddressState] = useState('pending');

	const [history, setHistory] = useState();

	const [syncResponses, setSyncResponses] = useState([]);

	const formatHash = (hash) => {
		if (!hash) return '';

		return hash.substring(0, 10) + '...' + hash.substring(hash.length - 10);
	}

	const onTagRemove = (tx, tag) => {
		// remove tag from the array of labels on the transaction in history
		const newHistory = history.map(historyTx => {
			if (tx.hash === historyTx.hash) {
				historyTx.labels = historyTx.labels.filter(label => label !== tag);
			}

			return historyTx;
		});

		setHistory(newHistory);
	}

	const columns = [
		{
			title: 'Nonce',
			dataIndex: 'nonce',
			key: 'nonce',
		},
		{
			title: 'Block',
			dataIndex: 'blockNumber',
			key: 'blockNumber',
			width: '10%',
			render: (text, record) => <a href={`https://etherscan.io/block/${text}`} target="_blank" rel="noopener noreferrer">{text}</a>,
		},
		{
			title: 'Transaction',
			dataIndex: 'hash',
			key: 'hash',
			width: '20%',
			render: (text, record) => <a href={`https://etherscan.io/tx/${text}`} target="_blank" rel="noopener noreferrer">{formatHash(text)}</a>,
		},
		{
			title: 'Labels',
			dataIndex: 'labels',
			key: 'labels',
			width: '20%',
			render: (text, record) => { return text.map(tag => <Tag tx={record} tag={tag} onTagRemove={onTagRemove} />) }
		},
		{
			title: 'From',
			dataIndex: 'from',
			key: 'from',
			width: '20%',
			render: (text, record) => <a href={`https://etherscan.io/address/${text}`} target="_blank" rel="noopener noreferrer">{formatHash(text)}</a>,
		},
		{
			title: 'To',
			dataIndex: 'to',
			key: 'to',
			width: '20%',
			render: (text, record) => <a href={`https://etherscan.io/address/${text}`} target="_blank" rel="noopener noreferrer">{formatHash(text)}</a>,
		},
		{
			title: 'Value',
			dataIndex: 'value',
			key: 'value',
			width: '20%',
			render: (text, record) => `${ethers.utils.formatEther(text)} ETH`,
		},
	];

	const onAddressChange = (e) => {
		let _address = e.target.value;

		try {
			_address = ethers.utils.getAddress(_address);
			setAddressState('success');
		} catch (e) {
			console.error(e)
			setAddressState('invalid')
		}

		setAddress(_address);
	}

	const onSync = async () => {
		// separate history into arrays of 500 each
		const historyBundles = [];
		for (let i = 0; i < history.length; i += 500) {
			historyBundles.push(history.slice(i, i + 500));
		}

		// create array for syncRespones of 0s equal to the length of historyBundles
		setSyncResponses(Array(historyBundles.length).fill(0));

		// make requests to server it api/transaction/bulk in batches of 500 transactions per request and log an array of 0 or 1 if a part of the batch upload promise returns as successful
		const results = await Promise.all(historyBundles.map(async (bundle, idx) => {
			const response = await fetch(`api/transaction/bulk/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ history: bundle }),
			});

			// update syncResponses array with the response from the server
			setSyncResponses((prev) => {
				const newSyncResponses = [...prev];
				newSyncResponses[idx] = response.status === 200;
				return newSyncResponses;
			});

			return response.ok;
		}));
	}

	useEffect(() => {
		console.log(syncResponses)
	}, [syncResponses])

	useEffect(() => {
		// take eth address or eth ens and convert to checksum address
		if (!address || addressState !== "success") return;

		const validateHistory = (history) => {
			if (history) {
				// return history with tags appended
				return history.map((tx) => {
					const labels = [];
					if (tx.from === address) {
						labels.push('sent');
					}
					if (tx.to === address) {
						labels.push('received');
					}
					if (tx.value > 0) {
						labels.push('value');
					}
					if (tx.value < 0) {
						labels.push('fee');
					}
					if (tx.value === 0) {
						labels.push('empty');
					}
					return { ...tx, labels };
				}).sort((a, b) => b.blockNumber - a.blockNumber);
			}

			return [];
		}

		const getOnChainHistory = () => {
			return provider.getHistory(address).then(history => {
				const validatedHistory = validateHistory(history);
				setHistory(validatedHistory);
			}).catch(error => {
				console.log(error);
			}).finally(() => {
				console.log('Finished getting history.');
			})
		}

		getOnChainHistory();
	}, [address])

	return (
		<div className="container">
			<h1>TBN</h1>

			<div className="input-group">
				<input type="text" className="form-control" placeholder="Address" value={address} onChange={onAddressChange} />

				<div className={`input-group-prepend ${addressState}`}>
					<span className="input-group-text">{addressState}</span>
				</div>

				<button className="btn btn-outline-secondary" type="button" onClick={() => setAddress('')}>Clear</button>

				{/* sync button */}
				<button className="btn btn-primary" type="button" onClick={async () => { await onSync() }}>Sync</button>
			</div>

			{/* Visualization of syncResponses */}
			<div className="sync-responses">
				{syncResponses.map((response, idx) => {
					return <div
						key={idx}
						className={response ? "success" : "fail"}></div>
				}).reverse()}
			</div>


			{history && <Table columns={columns} data={history} />}
		</div>
	);
}

export default App;
