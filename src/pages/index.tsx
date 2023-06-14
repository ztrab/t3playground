
import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  console.log(user);
  if(!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image src={user.profileImageUrl} alt="profile image" className="w-14 h-14 rounded-full" width={56} height={56} />
      <input placeholder="type some emojis" className="bg-transparent outline-none grow"/>
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
        <span>{post.content}</span>
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
      {data?.map((fullPost) => (
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
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="border-x border-slate-400 w-full h-full md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!isSignedIn && 
              <div className="flex justify-center">
                <SignInButton />
              </div>
            } 
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
