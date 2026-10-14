# Beskid task sheet

Thank you for helping. You are testing the tool, not being tested. If something is unclear or fails, that is useful to know.

You have a computer with the `beskid` command installed, and a folder named `Greeter` that sits next to the folder where you will work. You may use `beskid --help` and the help of any command. You may not use the internet, other documents, or ask the observer for help. The observer will only write things down.

Work in the folder the observer gave you. Do these things in order.

1. Create a new Beskid project called `hello`.
2. The folder `Greeter` is a small library that you want to use. Add it to your `hello` project as a dependency from its folder on disk. It is at `../Greeter` relative to your work folder.
3. Replace the whole content of the file `hello/Src/Main.bd` with this single line:

   ```
   i32 Main() { return Greeter.Answer() - 42; }
   ```

4. Check the project for errors.
5. Build the project into a program file named `hello-app` (on Windows `hello-app.exe`) in your work folder, next to the `hello` folder.
6. Run the project. It is finished when the run succeeds.

You have five minutes for the whole task. Tell the observer when you think you are done, or when you want to stop.
