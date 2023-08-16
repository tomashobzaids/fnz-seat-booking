import { get } from 'svelte/store';
import { preference, user } from './stores';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const save_preferences = () => {
	return setDoc(doc(db, 'preferences', get(user).uid), get(preference));
};