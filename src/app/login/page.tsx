import { login, signup } from './actions'
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";

export default function LoginPage() {
    return (
        <div>
            <form className={'flex flex-col gap-4'}>
                <Label htmlFor="email">Email:</Label>
                <Input id="email" name="email" type="email" />
                <Label htmlFor="password">Password:</Label>
                <Input id="password" name="password" type="password" />
                <div className={'flex items-center justify-between mt-4'}>
                    <Button formAction={login}>Log in</Button>
                    <Button formAction={signup}>Sign up</Button>
                </div>
            </form>
        </div>
    )
}
