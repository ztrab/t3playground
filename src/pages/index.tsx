
import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

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



const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if(postsLoading) return <LoadingPage />;

  if(!data) return <div>Something went wrong;</div>;

  return (
    <div className="flex flex-col overflow-y-auto">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  //Start fetching asap bc cache
  api.posts.getAll.useQuery();

  //return <div /> if both arent loaded
  if (!userLoaded) return <div/>;

  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
        {!isSignedIn && 
          <div className="flex justify-center">
            <SignInButton />
          </div>
        } 
        {isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
    </PageLayout>
          
  );
};

export default Home;
