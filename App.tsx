import { useCallback, useEffect, useRef, useState } from 'react'
import * as signalR from "@microsoft/signalr";
import './App.css'
import { SubscriptionResponse } from './subscriptionResponse';
import { SubscriptionNotification } from './subscriptionNotification';

const url = "https://localhost:8802/bondmonitorhub";

const App = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<string>('');
    const connnectionRef = useRef<signalR.HubConnection>()

    useEffect(() => {
        try {
            setConnectionStatus('Initialising');

            connnectionRef.current = new signalR.HubConnectionBuilder()
                .withUrl(url)
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            connnectionRef.current.start()
                .then(() => {
                    console.log('SignalR Connection initialised successfully');
                    setConnectionStatus('Connected');
                })
                .catch(err => {
                    console.log(`Error initialising SignalR connection to URL ${url}`, err);
                    setConnectionStatus('Error');
                });

            connnectionRef.current.on("SubscriptionSuccessful", (response: string) => {
                console.log('SubscriptionSuccessful received', response);
                const responseObj: SubscriptionResponse = JSON.parse(response);
                setMessages(prev => {
                    return [...prev, `Received subscription Id ${responseObj.SubscriptionId} for instruments ${responseObj.InstrumentIds?.join(', ')}`];
                });
            });

            connnectionRef.current.on("SubscriptionNotification", (notification: string) => {
                console.log('SubscriptionNotification received', notification);
                const notificationObj: SubscriptionNotification = JSON.parse(notification);
                setMessages(prev => {
                    return [
                        ...prev, 
                        `${notificationObj.SubscriptionId} notification:`, 
                        ...notificationObj.Data.map(item => `\t${item.InstrumentId} - bid:${item.Bid}, offer:${item.Offer}`)
                    ];
                });
            });
        } catch (e) {
            console.log(`Error initialising SignalR connection to URL ${url}`, e);
            setConnectionStatus('Error');
        }
    }, []);

    const handleSendClick = useCallback(async () => {
        if (connnectionRef.current) {
            await connnectionRef.current.invoke("SubscribeToInstruments", ['instrumentId1', 'instrumentId2']);
        }
    }, []);

    return (
        <div className='root'>
            <h2>Welcome</h2>
            <p>Connection status: {connectionStatus}</p>
            <div className='buttonContainer'>
                <button onClick={handleSendClick}>Send Message</button>
            </div>
            <p>Messages:</p>
            {messages.map((message, index) => (
                <p key={`${index}_${message}`}>{message}</p>
            ))}
        </div>
    )
}

export default App
