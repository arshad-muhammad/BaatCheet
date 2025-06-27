import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, get, set, remove } from 'firebase/database';
import { getStorage, ref as storageRef, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1f07q5_WsLZfroHsJglMbAtyDSxLkI1M",
  authDomain: "tutamar-fd94c.firebaseapp.com",
  databaseURL: "https://tutamar-fd94c-default-rtdb.firebaseio.com",
  projectId: "tutamar-fd94c",
  storageBucket: "tutamar-fd94c.appspot.com",
  messagingSenderId: "694753515768",
  appId: "1:694753515768:web:cbec9ef612f08405c9830d",
  measurementId: "G-260GT2FKGV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

/**
 * Fetches all chats and groups for a user from Firebase and returns them as an array of Chat objects.
 * @param userId The current user's ID
 */
export async function fetchUserChatsAndGroups(userId) {
  const userChatsRef = dbRef(db, `userChats/${userId}`);
  const userGroupsRef = dbRef(db, `userGroups/${userId}`);
  const [chatsSnap, groupsSnap] = await Promise.all([
    get(userChatsRef),
    get(userGroupsRef),
  ]);
  const chats = [];
  if (chatsSnap.exists()) {
    const val = chatsSnap.val();
    for (const chatId in val) {
      const chat = val[chatId];
      chats.push({
        id: chatId,
        name: chat.otherUserName || chat.otherUserId || 'Chat',
        avatar: chat.otherUserAvatar || '',
        lastMessage: chat.lastMessage || '',
        lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined,
        unreadCount: 0,
        isGroup: false,
        isOnline: false,
        otherUserId: chat.otherUserId,
        otherUserName: chat.otherUserName,
        otherUserAvatar: chat.otherUserAvatar,
      });
    }
  }
  if (groupsSnap.exists()) {
    const val = groupsSnap.val();
    for (const groupId in val) {
      const group = val[groupId];
      chats.push({
        id: groupId,
        name: group.name || 'Group',
        avatar: group.icon || '',
        lastMessage: '',
        lastMessageTime: group.joinedAt ? new Date(group.joinedAt) : undefined,
        unreadCount: 0,
        isGroup: true,
        members: [],
      });
    }
  }
  return chats;
}

/**
 * Fetches all users from Firebase and returns them as an array of { id, name, avatar } objects.
 */
export async function fetchAllUsers() {
  const usersRef = dbRef(db, 'users');
  const snap = await get(usersRef);
  const users = [];
  if (snap.exists()) {
    const val = snap.val();
    if (val.name) {
      users.push({
        id: val.uid || val.phone || 'unknown',
        name: val.name || '',
        avatar: val.photoURL || '',
        email: val.email || '',
        phone: val.phone || '',
      });
    } else {
      // Otherwise, treat as a map of userId -> userObj
      for (const uid in val) {
        users.push({
          id: uid, // always use UID as id
          name: val[uid].name || '',
          avatar: val[uid].photoURL || '',
          email: val[uid].email || '',
          phone: val[uid].phone || '',
        });
      }
    }
  }
  return users;
}

/**
 * Fetch invitations received by the user.
 */
export async function fetchReceivedInvitations(userId) {
  const refInv = dbRef(db, `chatInvitations/${userId}`);
  const snap = await get(refInv);
  const invitations = [];
  if (snap.exists()) {
    const val = snap.val();
    for (const id in val) {
      invitations.push({ id, ...val[id] });
    }
  }
  return invitations;
}

/**
 * Fetch invitations sent by the user.
 */
export async function fetchSentInvitations(userId) {
  // Scan all invitations for all users and filter by from === userId
  const refInv = dbRef(db, 'chatInvitations');
  const snap = await get(refInv);
  const invitations = [];
  if (snap.exists()) {
    const all = snap.val();
    for (const recipientId in all) {
      for (const invId in all[recipientId]) {
        const inv = all[recipientId][invId];
        if (inv.from === userId) {
          invitations.push({ id: invId, recipientId, ...inv });
        }
      }
    }
  }
  return invitations;
}

/**
 * Accept an invitation: mark as accepted and create chat for both users.
 */
export async function acceptInvitation(recipientId, invitationId) {
  const invRef = dbRef(db, `chatInvitations/${recipientId}/${invitationId}`);
  const snap = await get(invRef);
  if (!snap.exists()) throw new Error('Invitation not found');
  const inv = snap.val();
  // Mark as accepted
  await set(invRef, { ...inv, status: 'accepted' });
  // Fetch user info for both users
  const usersSnap = await get(dbRef(db, 'users'));
  let recipientInfo = { name: '', avatar: '' };
  let fromInfo = { name: '', avatar: '' };
  if (usersSnap.exists()) {
    const usersVal = usersSnap.val();
    if (usersVal[recipientId]) recipientInfo = { name: usersVal[recipientId].name || '', avatar: usersVal[recipientId].photoURL || '' };
    if (usersVal[inv.from]) fromInfo = { name: usersVal[inv.from].name || '', avatar: usersVal[inv.from].photoURL || '' };
  }
  // Create chat for both users if not already exists
  const chatId = invitationId; // Use invitationId as chatId for simplicity
  const userChatsRef1 = dbRef(db, `userChats/${recipientId}/${chatId}`);
  const userChatsRef2 = dbRef(db, `userChats/${inv.from}/${chatId}`);
  const chatMeta1 = {
    chatId,
    otherUserId: inv.from,
    otherUserName: fromInfo.name,
    otherUserAvatar: fromInfo.avatar,
    lastMessage: '',
    lastMessageTime: Date.now(),
  };
  const chatMeta2 = {
    chatId,
    otherUserId: recipientId,
    otherUserName: recipientInfo.name,
    otherUserAvatar: recipientInfo.avatar,
    lastMessage: '',
    lastMessageTime: Date.now(),
  };
  await set(userChatsRef1, chatMeta1);
  await set(userChatsRef2, chatMeta2);
  // Optionally, create chat node
  const chatRef = dbRef(db, `chats/${chatId}`);
  await set(chatRef, {
    createdAt: Date.now(),
    members: [recipientId, inv.from],
    isGroup: false,
  });
}

/**
 * Reject an invitation: mark as rejected.
 */
export async function rejectInvitation(recipientId, invitationId) {
  const invRef = dbRef(db, `chatInvitations/${recipientId}/${invitationId}`);
  const snap = await get(invRef);
  if (!snap.exists()) throw new Error('Invitation not found');
  const inv = snap.val();
  await set(invRef, { ...inv, status: 'rejected' });
}

/**
 * Delete a chat for a user. If both users have deleted, also delete the chat node.
 * Also remove any related chat invitations for that chatId.
 */
export async function deleteChatForUser(userId, chatId) {
  // Remove chat from userChats
  await set(dbRef(db, `userChats/${userId}/${chatId}`), null);
  // Remove chat node
  await set(dbRef(db, `chats/${chatId}`), null);
  // Remove related invitations (sent and received)
  // Remove from chatInvitations/{userId}/{chatId}
  await set(dbRef(db, `chatInvitations/${userId}/${chatId}`), null);
  // Remove from all recipients (for sent invitations)
  const invSnap = await get(dbRef(db, 'chatInvitations'));
  if (invSnap.exists()) {
    const all = invSnap.val();
    for (const recipientId in all) {
      if (all[recipientId][chatId]) {
        await set(dbRef(db, `chatInvitations/${recipientId}/${chatId}`), null);
      }
    }
  }
}

/**
 * Fetch statuses for users who have accepted invitations from the current user
 * or users whose invitations the current user has accepted
 */
export async function fetchStatusesForAcceptedContacts(userId: string) {
  try {
    // Get all accepted invitations (both sent and received)
    const [receivedInv, sentInv] = await Promise.all([
      fetchReceivedInvitations(userId),
      fetchSentInvitations(userId)
    ]);

    // Create a set of user IDs with accepted invitations
    const acceptedUserIds = new Set();
    
    // Add users whose invitations we accepted
    receivedInv.forEach(inv => {
      if (inv.status === 'accepted') {
        acceptedUserIds.add(inv.from);
      }
    });
    
    // Add users who accepted our invitations
    sentInv.forEach(inv => {
      if (inv.status === 'accepted') {
        acceptedUserIds.add(inv.recipientId);
      }
    });

    // Add current user to see their own statuses
    acceptedUserIds.add(userId);

    // Fetch statuses for accepted users
    const statusRef = dbRef(db, 'status');
    const snapshot = await get(statusRef);
    const statuses = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      
      Object.entries(data).forEach(([uid, userStatuses]) => {
        // Only include statuses from accepted contacts
        if (acceptedUserIds.has(uid)) {
          Object.entries(userStatuses as Record<string, unknown>).forEach(([sid, status]) => {
            if (
              typeof status === 'object' && status !== null &&
              'timestamp' in status && typeof (status as { timestamp: unknown }).timestamp === 'number'
            ) {
              const statusData = status as { timestamp: number };
              // Only include statuses from the last 24 hours
              if (statusData.timestamp > twentyFourHoursAgo) {
                statuses.push({
                  id: sid,
                  userId: uid,
                  ...statusData
                });
              }
            }
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    return statuses.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching statuses for accepted contacts:', error);
    return [];
  }
}

/**
 * Delete a status from both database and storage
 */
export async function deleteStatus(userId: string, statusId: string, mediaURL: string) {
  try {
    // Delete from database
    await remove(dbRef(db, `status/${userId}/${statusId}`));
    
    // Delete from storage
    const fileExt = mediaURL.split('.').pop();
    const fileRef = storageRef(storage, `status/${userId}/${statusId}.${fileExt}`);
    await deleteObject(fileRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting status:', error);
    throw error;
  }
}

/**
 * Get user information by ID
 */
export async function getUserInfo(userId: string) {
  try {
    const userRef = dbRef(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        id: userId,
        name: userData.name || 'Unknown User',
        avatar: userData.photoURL || '',
        phone: userData.phone || '',
        email: userData.email || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Fetch users who have accepted invitations from the current user
 * or users whose invitations the current user has accepted
 */
export async function fetchAcceptedContacts(userId: string) {
  try {
    // Get all accepted invitations (both sent and received)
    const [receivedInv, sentInv] = await Promise.all([
      fetchReceivedInvitations(userId),
      fetchSentInvitations(userId)
    ]);

    // Create a set of user IDs with accepted invitations
    const acceptedUserIds = new Set();
    
    // Add users whose invitations we accepted
    receivedInv.forEach(inv => {
      if (inv.status === 'accepted') {
        acceptedUserIds.add(inv.from);
      }
    });
    
    // Add users who accepted our invitations
    sentInv.forEach(inv => {
      if (inv.status === 'accepted') {
        acceptedUserIds.add(inv.recipientId);
      }
    });

    // Fetch user details for accepted contacts
    const users = await fetchAllUsers();
    const acceptedUsers = users.filter(user => acceptedUserIds.has(user.id));
    
    return acceptedUsers;
  } catch (error) {
    console.error('Error fetching accepted contacts:', error);
    return [];
  }
} 