import React, { useState } from 'react'
import '../App.css'
import Spinner from '../components/Spinner'
import {toast} from 'react-toastify'
import {getAuth} from 'firebase/auth'
import {getStorage, ref, uploadBytesResumable, getDownloadURL} from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router'

export default function CreateListing() {
    const navigate = useNavigate();
    const [geoLocationEnabled,setGeoLocationEnaled] = useState(true)
    const [loading,setLoading] = useState(false)
    const [formData,setFormData] = useState({type:'rent',name:'',bedrooms:1,bathrooms:1,parking:false,furnished:false,address:'',description:'',offer:false,regularPrice:50,discountedPrice:0, longitude:0,latitude:0,images:{}})
    const {type,name,bedrooms,bathrooms,parking,furnished,address,description,offer,regularPrice,discountedPrice,longitude,latitude,images} = formData;
    const auth = getAuth();

    const onChange = (e)=>{
        let boolean = null;
        if (e.target.value === 'true') {
            boolean = true;
        }
        if (e.target.value === 'false') {
            boolean = false;
        }
        // Files
        if (e.target.files) {
            setFormData({...formData,images:e.target.files})
        }
        // Texts/Booleans/Numbers
        if (!e.target.files) {
            setFormData({...formData,[e.target.id]:boolean??e.target.value});
        }
    }

    const onSubmit = async(e)=>{
        e.preventDefault()
        setLoading(true);
        if (+discountedPrice >= +regularPrice) {
            setLoading(false);
            toast.error('Discounted price must be lower than regular price');
            return;
        }
        if (images.length > 6) {
            setLoading(false);
            toast.error('maximum of 6 images are allowed');
        }
        let geoLocation = {lati:0,longi:0};
        let location;
        if (geoLocationEnabled) {
            const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${import.meta.env.VITE_REACT_APP_API}`);
            const data = await response.json();
            geoLocation.lati = data.features[0] != undefined ? data.features[0].geometry.coordinates[1] : 0;
            geoLocation.longi = data.features[0] != undefined ? data.features[0].geometry.coordinates[0] : 0;
            location = data.features[0] == undefined && undefined;
            if (location == undefined ) {
                setLoading(false);
                toast.error('Please enter a valid address');
                return;
            }
        }
        else{
            geoLocation.lati = latitude;
            geoLocation.longi = longitude;
        }
        const storeImage = async(image)=>{
            return new Promise((resolve,reject)=>{
                const storage = getStorage();
                const filename = `${auth.currentUser.uid}-${image.name}-${ uuidv4()}`;
                const storageRef = ref(storage, filename);
                const uploadTask = uploadBytesResumable(storageRef,image);
                uploadTask.on('state_changed', (snapshot) => {
                    // Observe state change events such as progress, pause, and resume
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('Upload is paused');
                            break;
                        case 'running':
                            console.log('Upload is running');
                            break;
                    }
                },
                (error) => {
                    // Handle unsuccessful uploads
                    reject(error);
                }, 
                () => {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {resolve(downloadURL);
                    });
                });
            })
        }
        const imgUrls = await Promise.all(
            [...images].map((image)=>storeImage(image))).catch((error)=>{
                setLoading(false);
                toast.error('Images were not uploaded');
                return;
            });
            const formDataCopy = {...formData, imgUrls, geoLocation, timeStamp:serverTimestamp(), userRef:auth.currentUser.uid };
            delete formDataCopy.images;
            !formDataCopy.offer && delete formDataCopy.discountedPrice;
            delete formDataCopy.latitude;
            delete formDataCopy.longitude;
            const docRef = await addDoc(collection(db,'listings'),formDataCopy);
            console.log(docRef)
            setLoading(false);
            toast.success('Listing was created successfully');
            navigate(`/category/${formDataCopy.type}/${docRef.id}`);
    }
    if (loading) {
        return <Spinner/>;
    }

    return (
        <main className='max-w-md mx-auto px-2'>
            <h1 className='text-3xl font-bold text-center mt-6'>Create Listing</h1>
            <form className='mt-6' onSubmit={onSubmit}>
                <label htmlFor="button" className='font-medium'>Sell/Rent</label>
                <div className='flex mb-6'>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${type==='rent'?'bg-white text-black':
                    'bg-slate-600 text-white'}`} type='button' id='type' value='sale' onClick={onChange}>SELL</button>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${type==='sale'?'bg-white text-black':
                    'bg-slate-600 text-white'} ms-3`} type='button' id='type' value='rent' onClick={onChange}>RENT</button>
                </div>
                <div>
                <label htmlFor="input" className='text-lg font-medium'>Name</label><br />
                <input id='name' value={name} onChange={onChange} placeholder='Name' maxLength='32' minLength='10' required className='w-full px-4 py-2 text-xl text-gray-700 bg-white 
                border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600'/>
                </div>
                <div className='flex space-x-6 mb-6'>
                    <div>
                        <label htmlFor="input" className='text-lg font-semibold'>Beds</label><br />
                        <input type="number" id='bedrooms' value={bedrooms} onChange={onChange} min='1' max='50' required
                        className='w-full px-4 py-2 text-xl text-gray-700 bg-white rounded border border-gray-300 text-center transition ease-in-out focus:border-slate-600'/>
                    </div>
                    <div>
                        <label htmlFor="input" className='text-lg font-semibold'>Bathrooms</label><br />
                        <input type="number" id='bathrooms' value={bathrooms} onChange={onChange} min='1' max='50' required
                        className='w-full px-4 py-2 text-xl text-gray-700 bg-white rounded border border-gray-300 text-center transition ease-in-out focus:border-slate-600'/>
                    </div>
                </div>
                <label htmlFor="button" className='font-medium'>Parking spot</label>
                <div className='flex mb-6'>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${!parking ?'bg-white text-black':
                    'bg-slate-600 text-white'}`} type='button' id='parking' value={true} onClick={onChange}>YES</button>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${parking ?'bg-white text-black':
                    'bg-slate-600 text-white'} ms-3`} type='button' id='parking' value={false} onClick={onChange}>NO</button>
                </div>
                <label htmlFor="button" className='font-medium'>Furnished</label>
                <div className='flex mb-6'>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${!furnished ?'bg-white text-black':
                    'bg-slate-600 text-white'}`} type='button' id='furnished' value={true} onClick={onChange}>YES</button>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${furnished ?'bg-white text-black':
                    'bg-slate-600 text-white'} ms-3`} type='button' id='furnished' value={false} onClick={onChange}>NO</button>
                </div>
                <div>
                    <label htmlFor="input" className='text-lg font-medium'>Address</label><br />
                    <textarea id='address' value={address} onChange={onChange} placeholder='Address' required className='w-full px-4 py-2 text-xl text-gray-700 bg-white 
                    border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600'></textarea>
                </div>
                {!geoLocationEnabled && (
                    <div className='flex space-x-6 mb-6'>
                        <div>
                            <label className='text-lg font-medium' htmlFor="latitude">Latitude</label>
                            <input id='latitude' min="-90" value={latitude} onChange={onChange} type='number' required className='w-full px-4 py-2 text-xl text-gray-700 bg-white 
                            border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600' max='90' />
                        </div>
                        <div>
                            <label className='text-lg font-medium' htmlFor="longitude">Longitude</label>
                            <input id='longitude' min="-180" value={longitude} onChange={onChange} type='number' required className='w-full px-4 py-2 text-xl text-gray-700 bg-white 
                            border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600' max='180' />
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="input" className='text-lg font-medium'>Description</label><br />
                    <input id='description' value={description} onChange={onChange} placeholder='Description' required className='w-full px-4 py-2 text-xl text-gray-700 bg-white 
                    border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600'/>
                </div>
                <label htmlFor="button" className='text-lg font-medium'>Offer</label>
                <div className='flex mb-6'>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${!offer?'bg-white text-black':
                    'bg-slate-600 text-white'}`} type='button' id='offer' value={true} onClick={onChange}>YES</button>
                    <button className={`px-7 py-3 font-medium text-sm shadow-sm rounded hover:shadow-lg focus:shadow-lg w-full transition ease-in-out ${offer ?'bg-white text-black':
                    'bg-slate-600 text-white'} ms-3`} type='button' id='offer' value={false} onClick={onChange}>NO</button>
                </div>
                <div className="flex items-center space-x-6">
                    <div>
                        <label htmlFor="input" className='text-lg font-medium'>Regular Price</label>
                        <input type="number" id='regularPrice' value={regularPrice} onChange={onChange} min='50' max='400000000' required className='w-full text-xl text-gray-700
                        px-4 py-3 bg-white border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600 text-center' />
                    </div>
                    {type==='rent'&& ( <p className='text-md text-gray-700 w-full'>$ / Month</p> )}
                </div>
                {offer && (
                    <div className="flex items-center space-x-6">
                    <div>
                        <label htmlFor="input" className='text-lg font-medium'>Discounted Price</label>
                        <input type="number" id='discountedPrice' value={discountedPrice} onChange={onChange} min='50' max='400000000' required={offer} className='w-full text-xl text-gray-700
                        px-4 py-3 bg-white border border-gray-300 rounded transition ease-in-out mb-6 focus:border-slate-600 text-center' />
                    </div>
                    {type==='rent'&& ( <p className='text-md text-gray-700 w-full'>$ / Month</p> )}
                </div>
                )}
                <div className='mb-6'>
                    <label htmlFor="image" className='text-xl font-medium'>Images</label>
                    <p className='text-gray-600'>The first image will be the cover (max 6)</p>
                    <input type="file" id='images' className='w-full px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded transition focus:border-slate-600
                    ease-in-out' accept='.jpg,.jpeg,.png' onChange={onChange} multiple required/>
                </div>
                <button type='submit' className='w-full mb-6 px-7 py-3 bg-blue-600 text-white font-medium text-sm rounded shadow-md hover:bg-blue-800 hover:shadow-lg focus:bg-blue-800 
                focus:shadow-lg active:bg-blue-900 active:shadow-lg transition ease-in-out'>Create Listing</button>
            </form>
        </main>
)
}