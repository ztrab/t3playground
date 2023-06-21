
import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Head from "next/head";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput('');
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if(errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post. Try again later");
      }
    }
  });
  const [input, setInput] = useState('');

  if(!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image 
        src={user.profileImageUrl} 
        alt="profile image" 
        className="w-14 h-14 rounded-full"
        width={56} 
        height={56} 
      />
      <input 
        className="bg-transparent outline-none grow"
        placeholder="type some emojis" 
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if(e.key === "Enter") {
            e.preventDefault();
            if(input !== "") {
              mutate({ content: input});
            } 
          }
        }}
        disabled={isPosting}
      />
      {!isPosting && (
        <button 
          onClick={() => mutate({ content: input})} 
          disabled={isPosting}
        >
          Post
        </button>
      )}

      {isPosting && (
        <div className="flex flex-col justify-center"><LoadingSpinner /></div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const {post, author} = props;
  return (
    <div key={post.id} className="flex p-4 gap-3 border-b border-slate-400">
      <Image src={author.profilePicture} className="w-14 h-14 rounded-full" alt="profile image" width={56} height={56} />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <span>{`@${author.username} `} </span><span> {` · ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
      
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if(postsLoading) return <LoadingPage />;

  if(!data) return <div>Something went wrong;</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

const SinglePostPage: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  //Start fetching asap bc cache
  api.posts.getAll.useQuery();

  //return <div /> if both arent loaded
  if (!userLoaded) return <div/>;

  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex justify-center h-screen">
        <div>Post View</div>
      </main>
    </>
  );
};

export default SinglePostPage;
