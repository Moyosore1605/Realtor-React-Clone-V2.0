import { getAuth, updateProfile } from 'firebase/auth'
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { db } from '../firebase'
import { FcHome } from 'react-icons/fc'
import { Link } from 'react-router-dom'
import ListingItem from '../components/ListingItem'
import CreateListing from '../pages/CreateListing'

export default function Profile() {
    const auth = getAuth()
    const navigate = useNavigate()
    const [changeDetails, setChangeDetails] = useState(false)
    const [listings, setListings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: auth.currentUser.displayName, email: auth.currentUser.email })
    const { name, email } = formData
    const onLogout = () => {
        auth.signOut()
        navigate('/')
    }
    const onChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }
    const onSubmit = async () => {
        try {
            if (auth.currentUser.displayName !== name) {
                await updateProfile(auth.currentUser, { displayName: name })
                const docRef = doc(db, 'users', auth.currentUser.uid)
                await updateDoc(docRef, { name })
                toast.success('Profile detail updated')
            }
        } catch (error) {
            toast.error('Could not update profile details')
        }
    }
    useEffect(() => {
        async function fetchUserListing() {
            const listingRef = collection(db, 'listings');
            const q = query(listingRef, where("userRef", "==", auth.currentUser.uid));
            try {
                const querySnap = await getDocs(q);
                const listings = querySnap.docs.map((doc) => ({ id: doc.id, data: doc.data() })).sort((a, b) => b.data.timeStamp - a.data.timeStamp);
                setListings(listings);
                setLoading(false);
            } catch (error) {
                console.log(error);
            }
        }
        fetchUserListing();
    }, [auth.currentUser.uid])

    return (
        <>
            <section className='max-w-6xl flex flex-col justify-center items-center'>
                <h1 className='font-bold text-center text-3xl mt-6'>My Profile</h1>
                <div className='w-full px-3 mt-6 md:w-[50%]'>
                    <form>
                        <input disabled={!changeDetails} onChange={onChange} type="text" id='name' value={name} className={`w-full px-4 py-2 border-gray-300 text-gray-700 rounded bg-white transition ease-in-out mb-6 ${changeDetails && "bg-red-200 focus:bg-red-200"}`} />
                        <input disabled type="email" id='email' value={email} className='w-full px-4 py-2 border-gray-300 text-gray-700 rounded bg-white transition ease-in-out mb-6' />
                        <div className='flex justify-between whitespace-nowrap text-sm sm:text-md'>
                            <p className='flex items-center md:text-sm'>Do you want to change your name?
                                <span className='text-red-600 hover:text-red-800 transition ease-in-out duration-200 ml-1 cursor-pointer' onClick={() => {
                                    changeDetails && onSubmit();
                                    setChangeDetails(!changeDetails)
                                }}>
                                    {changeDetails ? 'Apply Change' : 'Edit'}
                                </span>
                            </p>
                            <p onClick={onLogout} className='text-blue-600 hover:text-blue-800 transition ease-in-out cursor-pointer'>Sign out</p>
                        </div>
                    </form>
                    <button type='submit' className='flex mt-4 font-medium text-white w-full bg-blue-600 shadow-md hover:bg-blue-800 text-sm rounded transition ease-in-out hover:shadow-lg'>
                        <Link to='/create-listing' className='flex items-center w-full px-4 py-2 justify-center'>
                            <FcHome className='text-3xl rounded-full bg-red-200 border-2 p-1 mr-2' />
                            SELL OR RENT YOUR HOME
                        </Link>
                    </button>
                </div>
            </section>
            <div className='max-w-6xl px-3 mt-6 mx-auto'>
                {!loading && listings.length > 0 && (
                    <>
                        <h2 className='text-2xl text-center font-semibold mt-6 mb-6'>My Listings</h2>
                        <ul className='sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mt-6 mb-6'>
                            {listings.map((listing) => (
                                <ListingItem key={listing.id} id={listing.id} listing={listing.data} />
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    )
}