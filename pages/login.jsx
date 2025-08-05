import {useState} from 'react';
import {sigInWithPhoneNumber} from 'firebase/auth';
import {auth} from '../lib/firebase';
import { useRouter } from "next/router";

